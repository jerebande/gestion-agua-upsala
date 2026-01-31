const conx = require("../database/db");

class ClienteModel {
    // Actualizar o insertar bidones adeudados al guardar cliente
async actualizarBidones(clienteId, bidonesAdeudados) {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE clientes 
            SET bidones_adeudados = ? 
            WHERE id = ?;
        `;
        conx.query(sql, [bidonesAdeudados, clienteId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Consultar clientes incluyendo la cantidad de bidones adeudados
obtenerClientesPorUsuario(usuarioId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados 
            FROM clientes 
            WHERE usuario_id = ?;
        `;
        conx.query(sql, [usuarioId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

        obtenerCuentasPorFecha(fecha) {
            return new Promise((resolve, reject) => {
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
                conx.query(sql, [fecha, fecha, fecha, fecha, fecha], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }
    
    
   
    async eliminarCuenta(idCuenta) { const query = "DELETE FROM cuentas WHERE id = ?"; await conx.query(query, [idCuenta]); }
        async eliminarCliente(clienteId) {
            const query = "DELETE FROM clientes WHERE id = ?";
            await conx.query(query, [clienteId]);
        }
    
    
    obtenerClientesFiltrados(usuarioId, filtro) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, nombre, direccion, telefono 
                FROM clientes 
                WHERE usuario_id = ? AND 
                (nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?)
            `;
            const filtroConComodines = `%${filtro}%`;
            conx.query(sql, [usuarioId, filtroConComodines, filtroConComodines, filtroConComodines], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
    
    async guardarCliente({ nombre, direccion, telefono, usuario_id }) {
        const query = `
            INSERT INTO clientes (nombre, direccion, telefono, usuario_id, bidones_adeudados)
            VALUES (?, ?, ?, ?, 0); -- Inicializa con 0 bidones adeudados
        `;
        await conx.query(query, [nombre, direccion, telefono, usuario_id]);
    }
    
    
   
    
    actualizarEstadoPago(idCuenta, estado_pago) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE cuentas 
                SET estado_pago = ? 
                WHERE id = ?;
            `;
            conx.query(sql, [estado_pago, idCuenta], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
    



    agregarCuenta(cuenta) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon)
                VALUES (?, ?, ?, ?)`;
            conx.query(
                sql,
                [cuenta.cliente_id, cuenta.estado_pago, cuenta.cantidad_bidones, cuenta.precio_bidon],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    obtenerCuentasPorCliente(clienteId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, estado_pago, cantidad_bidones, precio_bidon, total, fecha_publicacion
                FROM cuentas
                WHERE cliente_id = ?
                ORDER BY fecha_publicacion DESC;
            `;
            conx.query(sql, [clienteId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
    
    actualizarCliente(id, datos) {
        return new Promise((resolve, reject) => {
            const sql = 
                `UPDATE clientes 
                SET estado_pago = ?, cantidad_bidones = ?, precio_bidon = ?, total = ? 
                WHERE id = ?`;
            conx.query(
                sql,
                [datos.estado_pago, datos.cantidad_bidones, datos.precio_bidon, datos.total, id],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }
    


    obtenerClientes() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, nombre, direccion, telefono FROM clientes`;
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    obtenerClientePorId(id) {
        return new Promise((resolve, reject) => {
            const sql = 
                `SELECT id, nombre, direccion, telefono, estado_pago, cantidad_bidones, 
                (cantidad_bidones * precio_bidon) AS total
                FROM clientes
                WHERE id = ?`;
            conx.query(sql, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }
}

module.exports = ClienteModel;
