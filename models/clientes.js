// models/clientes.js
const pool = require("../database/db");

class ClienteModel {
    async obtenerTodosLosClientesGlobal() {
        const sql = `SELECT * FROM clientes`; // Sin WHERE usuario_id
        const [rows] = await pool.query(sql);
        return rows;
    }

    async obtenerTodosLosClientesFiltrados(filtro) {
        const sql = `
            SELECT * FROM clientes 
            WHERE nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?
        `;
        const f = `%${filtro}%`;
        const [rows] = await pool.query(sql, [f, f, f]);
        return rows;
    }

    async obtenerClientesSegunRol(usuarioId, rol) {
        let sql;
        let params;
        
        if (rol === 'admin') {
            sql = "SELECT * FROM clientes"; // El admin ve todos
            params = [];
        } else {
            sql = "SELECT * FROM clientes WHERE usuario_id = ?"; // Usuario ve solo los suyos
            params = [usuarioId];
        }

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    // Actualizar o insertar bidones adeudados al guardar cliente
    async actualizarBidones(clienteId, bidonesAdeudados) {
        const sql = `
            UPDATE clientes 
            SET bidones_adeudados = ? 
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [bidonesAdeudados, clienteId]);
        return result;
    }

    // Consultar clientes incluyendo la cantidad de bidones adeudados
    async obtenerClientesPorUsuario(usuarioId) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados 
            FROM clientes 
            WHERE usuario_id = ?
        `;
        const [rows] = await pool.query(sql, [usuarioId]);
        return rows;
    }

    async obtenerCuentasPorFecha(fecha) {
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
            WHERE DATE(c.fecha_publicacion) = ?
            ORDER BY c.fecha_publicacion DESC;
        `;
        const [rows] = await pool.query(sql, [fecha, fecha, fecha, fecha, fecha]);
        return rows;
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

    async obtenerClientesFiltrados(usuarioId, filtro) {
        const sql = `
            SELECT id, nombre, direccion, telefono 
            FROM clientes 
            WHERE usuario_id = ? AND 
            (nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?)
        `;
        const filtroConComodines = `%${filtro}%`;
        const [rows] = await pool.query(sql, [usuarioId, filtroConComodines, filtroConComodines, filtroConComodines]);
        return rows;
    }

    async guardarCliente({ nombre, direccion, telefono, usuario_id }) {
        const query = `
            INSERT INTO clientes (nombre, direccion, telefono, usuario_id, bidones_adeudados)
            VALUES (?, ?, ?, ?, 0); -- Inicializa con 0 bidones adeudados
        `;
        const [result] = await pool.query(query, [nombre, direccion, telefono, usuario_id]);
        return result;
    }

    async actualizarEstadoPago(idCuenta, estado_pago) {
        const sql = `
            UPDATE cuentas 
            SET estado_pago = ? 
            WHERE id = ?;
        `;
        const [result] = await pool.query(sql, [estado_pago, idCuenta]);
        return result;
    }

    async agregarCuenta(cuenta) {
        const sql = `
            INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [
            cuenta.cliente_id,
            cuenta.estado_pago,
            cuenta.cantidad_bidones,
            cuenta.precio_bidon
        ]);
        return result;
    }

    async obtenerCuentasPorCliente(clienteId, pagina = 1) {
        const cuentasPorPagina = 5;
        const offset = (pagina - 1) * cuentasPorPagina;

        // Obtener el total de cuentas
        const sqlTotal = `SELECT COUNT(*) as total FROM cuentas WHERE cliente_id = ?`;
        const [countRows] = await pool.query(sqlTotal, [clienteId]);
        const totalCuentas = countRows[0].total;
        const totalPaginas = Math.ceil(totalCuentas / cuentasPorPagina);

        // Obtener las cuentas de la página actual
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

    async registrarPagoParcial(idCuenta, cantidadPagada) {
        // Primero obtener la cuenta
        const cuenta = await this.obtenerCuentaPorId(idCuenta);
        if (!cuenta) throw new Error('Cuenta no encontrada');

        const cantidadActual = Number(cuenta.cantidad_bidones) || 0;
        const precio = Number(cuenta.precio_bidon) || 0;

        if (cantidadPagada <= 0) throw new Error('Cantidad pagada inválida');

        if (cantidadPagada >= cantidadActual) {
            // Pago completo: marcar como pagado y ajustar total
            const nuevoTotal = cantidadActual * precio;
            const sqlUpdate = `UPDATE cuentas SET estado_pago = 1, total = ? WHERE id = ?`;
            const [result] = await pool.query(sqlUpdate, [nuevoTotal, idCuenta]);
            return result;
        } else {
            // Pago parcial: crear un registro pagado por la cantidad abonada y
            // actualizar la cuenta original con la cantidad restante
            const restante = cantidadActual - cantidadPagada;
            const totalRestante = restante * precio;
            const totalPagado = cantidadPagada * precio;

            const sqlUpdateOriginal = `UPDATE cuentas SET cantidad_bidones = ?, total = ? WHERE id = ?`;
            await pool.query(sqlUpdateOriginal, [restante, totalRestante, idCuenta]);

            const sqlInsertPago = `
                INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon, total)
                VALUES (?, 1, ?, ?, ?)
            `;
            const [result] = await pool.query(sqlInsertPago, [cuenta.cliente_id, cantidadPagada, precio, totalPagado]);
            return result;
        }
    }

    async actualizarCliente(id, datos) {
        const sql = `
            UPDATE clientes 
            SET estado_pago = ?, cantidad_bidones = ?, precio_bidon = ?, total = ? 
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [datos.estado_pago, datos.cantidad_bidones, datos.precio_bidon, datos.total, id]);
        return result;
    }

    async obtenerClientes() {
        const sql = `SELECT id, nombre, direccion, telefono FROM clientes`;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async obtenerClientePorId(id) {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados
            FROM clientes
            WHERE id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    async obtenerCuentasPorPeriodo(periodo) {
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
                estado_pago,
                IFNULL(SUM(total), 0) as total_por_estado,
                COUNT(*) as cantidad_transacciones,
                DATE_FORMAT(fecha_publicacion, '%Y-%m-%d') as fecha
            FROM cuentas
            WHERE fecha_publicacion >= ? AND fecha_publicacion <= ?
            GROUP BY estado_pago, DATE(fecha_publicacion)
            ORDER BY fecha DESC
        `;
        
        const [rows] = await pool.query(sql, [fechaInicio, hoy]);
        
        // Procesar resultados
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
                    case 1:
                        datos.pagados += monto;
                        break;
                    case 0:
                        datos.fiados += monto;
                        break;
                    case 2:
                        datos.transferencias += monto;
                        break;
                }
                datos.total += monto;
            });
        }
        
        return datos;
    }
}

module.exports = ClienteModel;