const pool = require("../database/db");

class ClienteModel {
    async obtenerClientesPorUsuario(usuarioId) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados 
            FROM clientes 
            WHERE usuario_id = ?
        `;
        const [rows] = await pool.query(sql, [usuarioId]);
        return rows;
    }

    async obtenerClientesFiltrados(usuarioId, filtro) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados
            FROM clientes 
            WHERE usuario_id = ? AND 
            (nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?)
        `;
        const f = `%${filtro}%`;
        const [rows] = await pool.query(sql, [usuarioId, f, f, f]);
        return rows;
    }

    async obtenerCuentasPorFecha(fecha, usuarioId) {
        const sql = `
            SELECT 
                c.id, c.estado_pago, c.cantidad_bidones, c.precio_bidon, 
                c.total, c.fecha_publicacion, cl.nombre AS cliente_nombre,
                (SELECT SUM(total) FROM cuentas WHERE DATE(fecha_publicacion) = ?) AS total_general,
                (SELECT SUM(total) FROM cuentas WHERE DATE(fecha_publicacion) = ? AND estado_pago = 1) AS total_pagados,
                (SELECT SUM(total) FROM cuentas WHERE DATE(fecha_publicacion) = ? AND estado_pago = 0) AS total_fiados,
                (SELECT SUM(total) FROM cuentas WHERE DATE(fecha_publicacion) = ? AND estado_pago = 2) AS total_transferencias
            FROM cuentas c
            JOIN clientes cl ON c.cliente_id = cl.id
            WHERE DATE(c.fecha_publicacion) = ? AND cl.usuario_id = ?
            ORDER BY c.fecha_publicacion DESC;
        `;
        const [rows] = await pool.query(sql, [fecha, fecha, fecha, fecha, fecha, usuarioId]);
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
            SELECT id, nombre, direccion, telefono, bidones_adeudados
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

    async obtenerCuentaPorId(idCuenta) {
        const sql = `SELECT id, cliente_id, estado_pago, cantidad_bidones, precio_bidon, total FROM cuentas WHERE id = ?`;
        const [rows] = await pool.query(sql, [idCuenta]);
        return rows.length > 0 ? rows[0] : null;
    }

    async guardarCliente({ nombre, direccion, telefono, usuario_id }) {
        const query = `
            INSERT INTO clientes (nombre, direccion, telefono, usuario_id, bidones_adeudados)
            VALUES (?, ?, ?, ?, 0);
        `;
        const [result] = await pool.query(query, [nombre, direccion, telefono, usuario_id]);
        return result;
    }

    
    async agregarCuenta({ cliente_id, estado_pago, cantidad_bidones, precio_bidon }) {
    // Calcular el total
    const total = cantidad_bidones * precio_bidon;

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

    // ***** MÉTODO MODIFICADO: ahora recibe montoPagado (decimal) *****
    async registrarPagoParcial(idCuenta, montoPagado) {
        const cuenta = await this.obtenerCuentaPorId(idCuenta);
        if (!cuenta) throw new Error('Cuenta no encontrada');

        const cantidadActual = Number(cuenta.cantidad_bidones) || 0;
        const precio = Number(cuenta.precio_bidon) || 0;
        const totalActual = cantidadActual * precio;

        if (montoPagado <= 0) throw new Error('Monto pagado inválido');
        if (montoPagado > totalActual) throw new Error('El monto pagado no puede superar el total de la cuenta');

        // Si el monto pagado cubre todo el total (con tolerancia por decimales)
        if (Math.abs(montoPagado - totalActual) < 0.01) {
            const sqlUpdate = `UPDATE cuentas SET estado_pago = 1, total = ? WHERE id = ?`;
            const [result] = await pool.query(sqlUpdate, [totalActual, idCuenta]);
            return result;
        } else {
            // Calcular la cantidad de bidones que corresponden al monto pagado
            const cantidadPagada = montoPagado / precio; // puede ser decimal
            const restante = cantidadActual - cantidadPagada;
            const totalRestante = restante * precio;
            const totalPagado = montoPagado;

            // Actualizar la cuenta original con el resto
            const sqlUpdateOriginal = `UPDATE cuentas SET cantidad_bidones = ?, total = ? WHERE id = ?`;
            await pool.query(sqlUpdateOriginal, [restante, totalRestante, idCuenta]);

            // Insertar una nueva cuenta con lo pagado (estado = pagado)
            const sqlInsertPago = `
                INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon, total)
                VALUES (?, 1, ?, ?, ?)
            `;
            const [result] = await pool.query(sqlInsertPago, [cuenta.cliente_id, cantidadPagada, precio, totalPagado]);
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
}

module.exports = ClienteModel;