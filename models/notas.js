// models/notas.js
const pool = require("../database/db");

class NotaModel {
    async contarNotas(usuarioId, vista, buscar = '', fileTypes = []) {
        let sql = "";
        let params = [];
        const searchPattern = `%${buscar}%`;

        let joinClause = '';
        let whereClause = '';

        if (fileTypes && fileTypes.length > 0) {
            joinClause = 'LEFT JOIN notas_archivos na ON n.id = na.nota_id';
            const placeholders = fileTypes.map(() => '?').join(',');
            whereClause += ` AND na.tipo IN (${placeholders})`;
            params.push(...fileTypes);
        }

        if (vista === 'misnotas') {
            sql = `SELECT COUNT(DISTINCT n.id) as total FROM notas n 
                   ${joinClause}
                   WHERE n.usuario_id = ? AND (n.titulo LIKE ? OR n.contenido LIKE ?) ${whereClause}`;
            params = [usuarioId, searchPattern, searchPattern, ...params];
        } else {
            sql = `SELECT COUNT(DISTINCT n.id) as total FROM notas n 
                   JOIN usuarios u ON n.usuario_id = u.id
                   ${joinClause}
                   WHERE (n.compartida = 1 OR n.usuario_id = ?) 
                   AND (n.titulo LIKE ? OR n.contenido LIKE ? OR u.nombre LIKE ?) ${whereClause}`;
            params = [usuarioId, searchPattern, searchPattern, searchPattern, ...params];
        }

        const [rows] = await pool.query(sql, params);
        return rows[0].total;
    }

    async obtenerPorUsuario(usuarioId, buscar = '', offset = 0, limit = 5, fileTypes = []) {
        let joinClause = '';
        let whereClause = '';
        let params = [parseInt(usuarioId)];
        const searchPattern = `%${buscar}%`;
        params.push(searchPattern, searchPattern);

        if (fileTypes && fileTypes.length > 0) {
            joinClause = 'LEFT JOIN notas_archivos na ON n.id = na.nota_id';
            const placeholders = fileTypes.map(() => '?').join(',');
            whereClause += ` AND na.tipo IN (${placeholders})`;
            params.push(...fileTypes);
        }

        params.push(limit, offset);

        const sql = `
            SELECT DISTINCT n.*, u.nombre AS autor_nombre, u.id AS autor_id
            FROM notas n
            JOIN usuarios u ON n.usuario_id = u.id
            ${joinClause}
            WHERE n.usuario_id = ? AND (n.titulo LIKE ? OR n.contenido LIKE ?) ${whereClause}
            ORDER BY n.fecha_actualizacion DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async obtenerFeed(usuarioId, buscar = '', offset = 0, limit = 5, fileTypes = []) {
        let joinClause = '';
        let whereClause = '';
        let params = [usuarioId];
        const searchPattern = `%${buscar}%`;
        params.push(searchPattern, searchPattern, searchPattern);

        if (fileTypes && fileTypes.length > 0) {
            joinClause = 'LEFT JOIN notas_archivos na ON n.id = na.nota_id';
            const placeholders = fileTypes.map(() => '?').join(',');
            whereClause += ` AND na.tipo IN (${placeholders})`;
            params.push(...fileTypes);
        }

        params.push(limit, offset);

        const sql = `
            SELECT DISTINCT n.*, u.nombre AS autor_nombre, u.id AS autor_id
            FROM notas n
            JOIN usuarios u ON n.usuario_id = u.id
            ${joinClause}
            WHERE (n.compartida = 1 OR n.usuario_id = ?) 
            AND (n.titulo LIKE ? OR n.contenido LIKE ? OR u.nombre LIKE ?) ${whereClause}
            ORDER BY n.fecha_actualizacion DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async obtenerPorId(id) {
        const sql = "SELECT * FROM notas WHERE id = ?";
        const [rows] = await pool.query(sql, [parseInt(id)]);
        return rows[0] || null;
    }

    async crear({ usuario_id, titulo, contenido, compartida }) {
        const sql = `
            INSERT INTO notas (usuario_id, titulo, contenido, compartida, fecha_creacion, fecha_actualizacion)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await pool.query(sql, [usuario_id, titulo, contenido, compartida]);
        return result;
    }

    async actualizar(id, { titulo, contenido, compartida }) {
        const sql = `
            UPDATE notas
            SET titulo = ?, contenido = ?, compartida = ?, fecha_actualizacion = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [titulo, contenido, compartida, parseInt(id)]);
        return result;
    }

    async eliminar(id) {
        const sql = "DELETE FROM notas WHERE id = ?";
        const [result] = await pool.query(sql, [parseInt(id)]);
        return result;
    }

    async obtenerArchivos(notaId) {
        const sql = "SELECT * FROM notas_archivos WHERE nota_id = ? ORDER BY id ASC";
        const [rows] = await pool.query(sql, [parseInt(notaId)]);
        return rows;
    }

    async guardarArchivo({ nota_id, nombre_original, nombre_archivo, tipo, ruta }) {
        const sql = `
            INSERT INTO notas_archivos (nota_id, nombre_original, nombre_archivo, tipo, ruta)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [nota_id, nombre_original, nombre_archivo, tipo, ruta]);
        return result;
    }

    async eliminarArchivos(notaId) {
        const sql = "DELETE FROM notas_archivos WHERE nota_id = ?";
        const [result] = await pool.query(sql, [parseInt(notaId)]);
        return result;
    }
}

module.exports = NotaModel;