// models/stockGastos.js
const pool = require("../database/db");

class StockGastosModel {
    // ========== STOCK ==========
    
    async obtenerStock(usuarioId) {
        const sql = "SELECT cantidad_actual FROM stock_usuario WHERE usuario_id = ?";
        const [rows] = await pool.query(sql, [usuarioId]);
        if (rows.length === 0) {
            // Crear registro si no existe
            await pool.query(
                "INSERT INTO stock_usuario (usuario_id, cantidad_actual) VALUES (?, 0)",
                [usuarioId]
            );
            return 0;
        }
        return parseFloat(rows[0].cantidad_actual) || 0;
    }

    async actualizarStock(usuarioId, cantidad, operacion = 'set') {
        let sql;
        let params;
        
        if (operacion === 'set') {
            sql = `INSERT INTO stock_usuario (usuario_id, cantidad_actual) 
                   VALUES (?, ?) 
                   ON DUPLICATE KEY UPDATE cantidad_actual = ?`;
            params = [usuarioId, cantidad, cantidad];
        } else if (operacion === 'sumar') {
            sql = `INSERT INTO stock_usuario (usuario_id, cantidad_actual) 
                   VALUES (?, ?) 
                   ON DUPLICATE KEY UPDATE cantidad_actual = cantidad_actual + ?`;
            params = [usuarioId, cantidad, cantidad];
        } else if (operacion === 'restar') {
            sql = `UPDATE stock_usuario SET cantidad_actual = GREATEST(0, cantidad_actual - ?) WHERE usuario_id = ?`;
            params = [cantidad, usuarioId];
        }
        
        const [result] = await pool.query(sql, params);
        return result;
    }

    async descontarStock(usuarioId, cantidad, motivo, referenciaId = null) {
        // Descontar del stock
        await this.actualizarStock(usuarioId, cantidad, 'restar');
        
        // Registrar movimiento
        const sqlMov = `
            INSERT INTO stock_movimientos (usuario_id, tipo_movimiento, cantidad, motivo, referencia_id)
            VALUES (?, 'egreso', ?, ?, ?)
        `;
        await pool.query(sqlMov, [usuarioId, cantidad, motivo, referenciaId]);
    }

    async ingresarStock(usuarioId, cantidad, motivo = 'Ingreso manual') {
        await this.actualizarStock(usuarioId, cantidad, 'sumar');
        
        const sqlMov = `
            INSERT INTO stock_movimientos (usuario_id, tipo_movimiento, cantidad, motivo)
            VALUES (?, 'ingreso', ?, ?)
        `;
        await pool.query(sqlMov, [usuarioId, cantidad, motivo]);
    }

    async obtenerMovimientosStock(usuarioId, limite = 50) {
        const sql = `
            SELECT * FROM stock_movimientos 
            WHERE usuario_id = ? 
            ORDER BY fecha_movimiento DESC 
            LIMIT ?
        `;
        const [rows] = await pool.query(sql, [usuarioId, limite]);
        return rows;
    }

    // ========== CATEGORÍAS DE GASTOS ==========
    
    async obtenerCategorias(usuarioId) {
        const sql = "SELECT * FROM categorias_gastos WHERE usuario_id = ? ORDER BY nombre";
        const [rows] = await pool.query(sql, [usuarioId]);
        return rows;
    }

    async crearCategoria(usuarioId, nombre) {
        const sql = "INSERT INTO categorias_gastos (usuario_id, nombre) VALUES (?, ?)";
        const [result] = await pool.query(sql, [usuarioId, nombre.trim()]);
        return result.insertId;
    }

    async eliminarCategoria(categoriaId, usuarioId) {
        const sql = "DELETE FROM categorias_gastos WHERE id = ? AND usuario_id = ?";
        const [result] = await pool.query(sql, [categoriaId, usuarioId]);
        return result.affectedRows > 0;
    }

    // ========== GASTOS ==========
    
    async registrarGasto(usuarioId, categoriaId, monto, descripcion, fechaGasto) {
        const sql = `
            INSERT INTO gastos (usuario_id, categoria_id, monto, descripcion, fecha_gasto)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [usuarioId, categoriaId, monto, descripcion, fechaGasto]);
        return result.insertId;
    }

    async obtenerGastos(usuarioId, fechaInicio = null, fechaFin = null) {
        let sql = `
            SELECT g.*, c.nombre AS categoria_nombre
            FROM gastos g
            JOIN categorias_gastos c ON g.categoria_id = c.id
            WHERE g.usuario_id = ?
        `;
        const params = [usuarioId];
        
        if (fechaInicio && fechaFin) {
            sql += " AND g.fecha_gasto BETWEEN ? AND ?";
            params.push(fechaInicio, fechaFin);
        }
        
        sql += " ORDER BY g.fecha_gasto DESC, g.fecha_registro DESC";
        
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async obtenerGastoPorId(gastoId, usuarioId) {
        const sql = "SELECT * FROM gastos WHERE id = ? AND usuario_id = ?";
        const [rows] = await pool.query(sql, [gastoId, usuarioId]);
        return rows.length > 0 ? rows[0] : null;
    }

    async actualizarGasto(gastoId, usuarioId, { categoria_id, monto, descripcion, fecha_gasto }) {
        const sql = `
            UPDATE gastos 
            SET categoria_id = ?, monto = ?, descripcion = ?, fecha_gasto = ?
            WHERE id = ? AND usuario_id = ?
        `;
        const [result] = await pool.query(sql, [
            categoria_id, monto, descripcion, fecha_gasto, gastoId, usuarioId
        ]);
        return result.affectedRows > 0;
    }

    async obtenerResumenGastos(usuarioId, periodo = 'mes') {
        let fechaInicio;
        const hoy = new Date();
        
        switch(periodo) {
            case '1dia':
                fechaInicio = hoy;
                break;
            case '7dias':
                fechaInicio = new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000);
                break;
            case 'semana':
                fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'mes':
            case '1mes':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
                break;
            case '6meses':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate());
                break;
            case 'anio':
            case '1anio':
                fechaInicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
                break;
            default:
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
        }
        
        const sql = `
            SELECT 
                c.nombre AS categoria,
                SUM(g.monto) AS total,
                COUNT(*) AS cantidad
            FROM gastos g
            JOIN categorias_gastos c ON g.categoria_id = c.id
            WHERE g.usuario_id = ? AND g.fecha_gasto >= ?
            GROUP BY c.id, c.nombre
            ORDER BY total DESC
        `;
        const [rows] = await pool.query(sql, [usuarioId, fechaInicio]);
        
        const totalGeneral = rows.reduce((acc, r) => acc + parseFloat(r.total), 0);
        
        return {
            porCategoria: rows,
            totalGeneral
        };
    }

    async eliminarGasto(gastoId, usuarioId) {
        const sql = "DELETE FROM gastos WHERE id = ? AND usuario_id = ?";
        const [result] = await pool.query(sql, [gastoId, usuarioId]);
        return result.affectedRows > 0;
    }
}

module.exports = StockGastosModel;