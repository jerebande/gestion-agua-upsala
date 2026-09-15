const pool = require("../database/db");

class ClienteModel {
    async obtenerClientesPorUsuario(usuarioId) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados, dia_reparto
            FROM clientes 
            WHERE usuario_id = ?
        `;
        const [rows] = await pool.query(sql, [usuarioId]);
        return rows;
    }

    async obtenerClientesFiltrados(usuarioId, filtro = null, dia = null) {
        let sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados, dia_reparto
            FROM clientes 
            WHERE usuario_id = ? 
        `;
        const params = [usuarioId];
        if (filtro) {
            sql += ` AND (nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?)`;
            const f = `%${filtro}%`;
            params.push(f, f, f);
        }
        if (dia) {
            sql += ` AND dia_reparto = ?`;
            params.push(dia);
        }
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async obtenerCuentasPorFecha(fecha, usuarioId) {
        const sql = `
            SELECT 
                c.id, c.estado_pago, c.cantidad_bidones, c.precio_bidon, 
                c.total, c.fecha_publicacion, cl.nombre AS cliente_nombre
            FROM cuentas c
            JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.fecha_publicacion >= ? AND c.fecha_publicacion < DATE_ADD(?, INTERVAL 1 DAY)
              AND cl.usuario_id = ?
            ORDER BY c.fecha_publicacion DESC;
        `;
        const [rows] = await pool.query(sql, [fecha, fecha, usuarioId]);
        return rows;
    }

    async obtenerCuentasPorPeriodo(periodo, usuarioId) {
        let fechaInicio;
        const hoy = new Date();
        
        switch(periodo) {
            case '7dias':
                fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1mes':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
                break;
            case '6meses':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate());
                break;
            case '1anio':
                fechaInicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
                break;
            default:
                fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        
        const sql = `
            SELECT 
                c.estado_pago,
                IFNULL(SUM(c.total), 0) as total_por_estado,
                COUNT(*) as cantidad_transacciones,
                DATE_FORMAT(c.fecha_publicacion, '%Y-%m-%d') as fecha
            FROM cuentas c
            JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.fecha_publicacion >= ? AND c.fecha_publicacion <= ? AND cl.usuario_id = ?
            GROUP BY c.estado_pago, DATE(c.fecha_publicacion)
            ORDER BY fecha DESC
        `;
        
        const [rows] = await pool.query(sql, [fechaInicio, hoy, usuarioId]);
        
        const datos = {
            pagados: 0,
            fiados: 0,
            transferencias: 0,
            total: 0,
            detalles: rows
        };
        
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                const monto = parseFloat(row.total_por_estado) || 0;
                switch(row.estado_pago) {
                    case 1: datos.pagados += monto; break;
                    case 0: datos.fiados += monto; break;
                    case 2: datos.transferencias += monto; break;
                }
                datos.total += monto;
            });
        }
        
        return datos;
    }

    async obtenerClientePorId(id, usuarioId) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados, dia_reparto
            FROM clientes
            WHERE id = ? AND usuario_id = ?
        `;
        const [rows] = await pool.query(sql, [id, usuarioId]);
        return rows[0];
    }

    async obtenerCuentasPorCliente(clienteId, pagina = 1) {
        const cuentasPorPagina = 5;
        const offset = (pagina - 1) * cuentasPorPagina;

        const sqlTotal = `SELECT COUNT(*) as total FROM cuentas WHERE cliente_id = ?`;
        const [countRows] = await pool.query(sqlTotal, [clienteId]);
        const totalCuentas = countRows[0].total;
        const totalPaginas = Math.ceil(totalCuentas / cuentasPorPagina);

        const sql = `
            SELECT id, estado_pago, cantidad_bidones, precio_bidon, total, fecha_publicacion
            FROM cuentas
            WHERE cliente_id = ?
            ORDER BY fecha_publicacion DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(sql, [clienteId, cuentasPorPagina, offset]);
        return {
            cuentas: rows,
            paginaActual: pagina,
            totalCuentas,
            totalPaginas
        };
    }

    // ⭐ Totales globales por estado de pago (todas las cuentas del cliente)
    async obtenerTotalesPorCliente(clienteId) {
        const sql = `
            SELECT 
                estado_pago,
                IFNULL(SUM(total), 0) AS total_dinero,
                IFNULL(SUM(cantidad_bidones), 0) AS total_bidones,
                COUNT(*) AS cantidad_cuentas
            FROM cuentas
            WHERE cliente_id = ?
            GROUP BY estado_pago
        `;
        const [rows] = await pool.query(sql, [clienteId]);
        
        const resultado = {
            pagado: { dinero: 0, bidones: 0, cuentas: 0 },
            fiado: { dinero: 0, bidones: 0, cuentas: 0 },
            transferencia: { dinero: 0, bidones: 0, cuentas: 0 }
        };
        
        rows.forEach(row => {
            const dinero = parseFloat(row.total_dinero) || 0;
            const bidones = parseFloat(row.total_bidones) || 0;
            const cuentas = parseInt(row.cantidad_cuentas) || 0;
            
            if (row.estado_pago == 1) {
                resultado.pagado = { dinero, bidones, cuentas };
            } else if (row.estado_pago == 2) {
                resultado.transferencia = { dinero, bidones, cuentas };
            } else {
                resultado.fiado = { dinero, bidones, cuentas };
            }
        });
        
        return resultado;
    }

    async obtenerCuentaPorId(idCuenta) {
        const sql = `SELECT id, cliente_id, estado_pago, cantidad_bidones, precio_bidon, total FROM cuentas WHERE id = ?`;
        const [rows] = await pool.query(sql, [idCuenta]);
        return rows.length > 0 ? rows[0] : null;
    }

    // Cuentas fiadas (estado_pago = 0) de un cliente, sin paginar — usadas por el asistente/chatbot
    async obtenerCuentasFiadasPorCliente(clienteId) {
        const sql = `
            SELECT id, cliente_id, cantidad_bidones, precio_bidon, total, fecha_publicacion
            FROM cuentas
            WHERE cliente_id = ? AND estado_pago = 0
            ORDER BY fecha_publicacion ASC
        `;
        const [rows] = await pool.query(sql, [clienteId]);
        return rows;
    }

    async guardarCliente({ nombre, direccion, telefono, usuario_id, dia_reparto = null }) {
        const query = `
            INSERT INTO clientes (nombre, direccion, telefono, usuario_id, bidones_adeudados, dia_reparto)
            VALUES (?, ?, ?, ?, 0, ?);
        `;
        const [result] = await pool.query(query, [nombre, direccion, telefono, usuario_id, dia_reparto]);
        return result;
    }

    async agregarCuenta({ cliente_id, estado_pago, cantidad_bidones, precio_bidon, total }) {
        const sql = `
            INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon, total)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [
            cliente_id,
            estado_pago,
            cantidad_bidones,
            precio_bidon,
            total
        ]);
        return result;
    }

    async actualizarDatosBasicos(id, { nombre, direccion, telefono }) {
        const sql = "UPDATE clientes SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?";
        const [result] = await pool.query(sql, [nombre, direccion, telefono, id]);
        return result;
    }

    async actualizarBidones(clienteId, bidonesAdeudados) {
        const sql = `UPDATE clientes SET bidones_adeudados = ? WHERE id = ?`;
        const [result] = await pool.query(sql, [bidonesAdeudados, clienteId]);
        return result;
    }

    async actualizarEstadoPago(idCuenta, estado_pago) {
        const sql = `UPDATE cuentas SET estado_pago = ? WHERE id = ?`;
        const [result] = await pool.query(sql, [estado_pago, idCuenta]);
        return result;
    }

    // estadoPago: 1 = pagado (efectivo), 2 = transferencia
    async registrarPagoParcial(idCuenta, montoPagado, estadoPago = 1) {
        const cuenta = await this.obtenerCuentaPorId(idCuenta);
        if (!cuenta) throw new Error('Cuenta no encontrada');

        estadoPago = parseInt(estadoPago) === 2 ? 2 : 1;

        const cantidadActual = Number(cuenta.cantidad_bidones) || 0;
        const precio = Number(cuenta.precio_bidon) || 0;
        const totalActual = cantidadActual * precio;

        if (montoPagado <= 0) throw new Error('Monto pagado inválido');
        if (montoPagado > totalActual) throw new Error('El monto pagado no puede superar el total de la cuenta');

        if (Math.abs(montoPagado - totalActual) < 0.01) {
            const sqlUpdate = `UPDATE cuentas SET estado_pago = ?, total = ? WHERE id = ?`;
            const [result] = await pool.query(sqlUpdate, [estadoPago, totalActual, idCuenta]);
            return result;
        } else {
            const cantidadPagada = montoPagado / precio;
            const restante = cantidadActual - cantidadPagada;
            const totalRestante = restante * precio;
            const totalPagado = montoPagado;

            const sqlUpdateOriginal = `UPDATE cuentas SET cantidad_bidones = ?, total = ? WHERE id = ?`;
            await pool.query(sqlUpdateOriginal, [restante, totalRestante, idCuenta]);

            const sqlInsertPago = `
                INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon, total)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(sqlInsertPago, [cuenta.cliente_id, estadoPago, cantidadPagada, precio, totalPagado]);
            return result;
        }
    }

    async eliminarCuenta(idCuenta) {
        const query = "DELETE FROM cuentas WHERE id = ?";
        const [result] = await pool.query(query, [idCuenta]);
        return result;
    }

    async eliminarCliente(clienteId) {
        const query = "DELETE FROM clientes WHERE id = ?";
        const [result] = await pool.query(query, [clienteId]);
        return result;
    }

    // ----- MÉTODOS PARA ESTADOS SEMANALES -----
    async obtenerEstadoSemanal(clienteId, semana) {
        const sql = `SELECT * FROM clientes_estados_semanales WHERE cliente_id = ? AND semana = ?`;
        const [rows] = await pool.query(sql, [clienteId, semana]);
        return rows[0];
    }

    async obtenerEstadosSemanalesPorCliente(clienteId) {
        const sql = `SELECT id, semana, estado FROM clientes_estados_semanales WHERE cliente_id = ? ORDER BY semana DESC`;
        const [rows] = await pool.query(sql, [clienteId]);
        return rows;
    }

    async guardarEstadoSemanal(clienteId, semana, estado) {
        const sql = `
            INSERT INTO clientes_estados_semanales (cliente_id, semana, estado)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE estado = VALUES(estado)
        `;
        const [result] = await pool.query(sql, [clienteId, semana, estado]);
        return result;
    }

    async eliminarEstadoSemanal(id) {
        const sql = `DELETE FROM clientes_estados_semanales WHERE id = ?`;
        const [result] = await pool.query(sql, [id]);
        return result;
    }

    async obtenerEstadosSemanalesPorUsuarioYSemana(usuarioId, semana) {
        const sql = `
            SELECT ces.cliente_id, ces.estado
            FROM clientes_estados_semanales ces
            JOIN clientes c ON ces.cliente_id = c.id
            WHERE c.usuario_id = ? AND ces.semana = ?
        `;
        const [rows] = await pool.query(sql, [usuarioId, semana]);
        const map = {};
        rows.forEach(row => map[row.cliente_id] = row.estado);
        return map;
    }

    async obtenerTotalFiadoPorClienteYFecha(clienteId, fecha) {
        const sql = `
            SELECT IFNULL(SUM(total), 0) as total_fiado
            FROM cuentas
            WHERE cliente_id = ? 
              AND fecha_publicacion >= ? 
              AND fecha_publicacion < DATE_ADD(?, INTERVAL 1 DAY)
              AND estado_pago = 0
        `;
        const [rows] = await pool.query(sql, [clienteId, fecha, fecha]);
        return rows[0].total_fiado;
    }

    async obtenerTotalFiadoGeneral(clienteId) {
        const sql = `
            SELECT IFNULL(SUM(total), 0) as total_fiado
            FROM cuentas
            WHERE cliente_id = ? AND estado_pago = 0
        `;
        const [rows] = await pool.query(sql, [clienteId]);
        return rows[0].total_fiado;
    }

    // ----- MÉTODOS PARA ENTREGAS DIARIAS -----
    async marcarEntregaHoy(clienteId) {
        const { obtenerFechaLocal } = require("../utils/fecha");
        const fecha = obtenerFechaLocal();
        const sql = `
            INSERT INTO entregas_diarias (cliente_id, fecha)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id = id
        `;
        const [result] = await pool.query(sql, [clienteId, fecha]);
        return result;
    }

    async quitarEntregaHoy(clienteId) {
        const { obtenerFechaLocal } = require("../utils/fecha");
        const fecha = obtenerFechaLocal();
        const sql = `DELETE FROM entregas_diarias WHERE cliente_id = ? AND fecha = ?`;
        const [result] = await pool.query(sql, [clienteId, fecha]);
        return result;
    }

    async obtenerEntregasHoy(usuarioId, fecha) {
        const sql = `
            SELECT ed.cliente_id
            FROM entregas_diarias ed
            JOIN clientes c ON ed.cliente_id = c.id
            WHERE c.usuario_id = ? AND ed.fecha = ?
        `;
        const [rows] = await pool.query(sql, [usuarioId, fecha]);
        return rows.map(row => row.cliente_id);
    }
}

module.exports = ClienteModel;