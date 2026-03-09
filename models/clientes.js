const conx = require("../database/db");

class ClienteModel {
    obtenerTodosLosClientesGlobal() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM clientes`; // Sin WHERE usuario_id
        conx.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

obtenerTodosLosClientesFiltrados(filtro) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM clientes 
            WHERE nombre LIKE ? OR direccion LIKE ? OR telefono LIKE ?`;
        const f = `%${filtro}%`;
        conx.query(sql, [f, f, f], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}
    obtenerClientesSegunRol(usuarioId, rol) {
    return new Promise((resolve, reject) => {
        let sql;
        let params;
        
        if (rol === 'admin') {
            sql = "SELECT * FROM clientes"; // El admin ve todos
            params = [];
        } else {
            sql = "SELECT * FROM clientes WHERE usuario_id = ?"; // Usuario ve solo los suyos
            params = [usuarioId];
        }

        conx.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}
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

    obtenerCuentasPorCliente(clienteId, pagina = 1) {
        return new Promise((resolve, reject) => {
            const cuentasPorPagina = 5;
            const offset = (pagina - 1) * cuentasPorPagina;

            // Obtener el total de cuentas
            const sqlTotal = `SELECT COUNT(*) as total FROM cuentas WHERE cliente_id = ?`;
            conx.query(sqlTotal, [clienteId], (err, countResults) => {
                if (err) return reject(err);
                
                const totalCuentas = countResults[0].total;
                const totalPaginas = Math.ceil(totalCuentas / cuentasPorPagina);

                // Obtener las cuentas de la página actual
                const sql = `
                    SELECT id, estado_pago, cantidad_bidones, precio_bidon, total, fecha_publicacion
                    FROM cuentas
                    WHERE cliente_id = ?
                    ORDER BY fecha_publicacion DESC
                    LIMIT ? OFFSET ?;
                `;
                conx.query(sql, [clienteId, cuentasPorPagina, offset], (err, results) => {
                    if (err) return reject(err);
                    resolve({
                        cuentas: results,
                        paginaActual: pagina,
                        totalCuentas,
                        totalPaginas
                    });
                });
            });
        });
    }

    obtenerCuentaPorId(idCuenta) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, cliente_id, estado_pago, cantidad_bidones, precio_bidon, total FROM cuentas WHERE id = ?`;
            conx.query(sql, [idCuenta], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }

    registrarPagoParcial(idCuenta, cantidadPagada) {
        return new Promise((resolve, reject) => {
            // Primero obtener la cuenta
            this.obtenerCuentaPorId(idCuenta).then((cuenta) => {
                if (!cuenta) return reject(new Error('Cuenta no encontrada'));

                const cantidadActual = Number(cuenta.cantidad_bidones) || 0;
                const precio = Number(cuenta.precio_bidon) || 0;

                if (cantidadPagada <= 0) return reject(new Error('Cantidad pagada inválida'));

                if (cantidadPagada >= cantidadActual) {
                    // Pago completo: marcar como pagado y ajustar total
                    const nuevoTotal = cantidadActual * precio;
                    const sqlUpdate = `UPDATE cuentas SET estado_pago = 1, total = ? WHERE id = ?`;
                    conx.query(sqlUpdate, [nuevoTotal, idCuenta], (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                } else {
                    // Pago parcial: crear un registro pagado por la cantidad abonada y
                    // actualizar la cuenta original con la cantidad restante
                    const restante = cantidadActual - cantidadPagada;
                    const totalRestante = restante * precio;
                    const totalPagado = cantidadPagada * precio;

                    const sqlUpdateOriginal = `UPDATE cuentas SET cantidad_bidones = ?, total = ? WHERE id = ?`;
                    conx.query(sqlUpdateOriginal, [restante, totalRestante, idCuenta], (err) => {
                        if (err) return reject(err);

                        const sqlInsertPago = `
                            INSERT INTO cuentas (cliente_id, estado_pago, cantidad_bidones, precio_bidon, total)
                            VALUES (?, 1, ?, ?, ?)
                        `;
                        conx.query(sqlInsertPago, [cuenta.cliente_id, cantidadPagada, precio, totalPagado], (err2, results2) => {
                            if (err2) return reject(err2);
                            resolve(results2);
                        });
                    });
                }
            }).catch(reject);
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
        const sql = `
            SELECT id, nombre, direccion, telefono, bidones_adeudados
            FROM clientes
            WHERE id = ?`;
        conx.query(sql, [id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
}

obtenerCuentasPorPeriodo(periodo) {
    return new Promise((resolve, reject) => {
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
        
        conx.query(sql, [fechaInicio, hoy], (err, results) => {
            if (err) return reject(err);
            
            // Procesar resultados
            const datos = {
                pagados: 0,
                fiados: 0,
                transferencias: 0,
                total: 0,
                detalles: results
            };
            
            if (results && results.length > 0) {
                results.forEach(row => {
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
            
            resolve(datos);
        });
    });
}

}

module.exports = ClienteModel;
