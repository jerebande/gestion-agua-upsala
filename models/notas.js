const conx = require("../database/db");

class NotaModel {
    contarNotas(usuarioId, vista, buscar = '', fileTypes = []) {
        return new Promise((resolve, reject) => {
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

            conx.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].total);
            });
        });
    }

    obtenerPorUsuario(usuarioId, buscar = '', offset = 0, limit = 5, fileTypes = []) {
        return new Promise((resolve, reject) => {
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
                LIMIT ? OFFSET ?`;

            conx.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    obtenerFeed(usuarioId, buscar = '', offset = 0, limit = 5, fileTypes = []) {
        return new Promise((resolve, reject) => {
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
                LIMIT ? OFFSET ?`;

            conx.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM notas WHERE id = ?";
            conx.query(sql, [parseInt(id)], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    crear({ usuario_id, titulo, contenido, compartida }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO notas (usuario_id, titulo, contenido, compartida, fecha_creacion, fecha_actualizacion)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `;
            conx.query(sql, [usuario_id, titulo, contenido, compartida], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    actualizar(id, { titulo, contenido, compartida }) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE notas
                SET titulo = ?, contenido = ?, compartida = ?, fecha_actualizacion = NOW()
                WHERE id = ?
            `;
            conx.query(sql, [titulo, contenido, compartida, parseInt(id)], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    eliminar(id) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM notas WHERE id = ?";
            conx.query(sql, [parseInt(id)], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    obtenerArchivos(notaId) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM notas_archivos WHERE nota_id = ? ORDER BY id ASC";
            conx.query(sql, [parseInt(notaId)], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    guardarArchivo({ nota_id, nombre_original, nombre_archivo, tipo, ruta }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO notas_archivos (nota_id, nombre_original, nombre_archivo, tipo, ruta)
                VALUES (?, ?, ?, ?, ?)
            `;
            conx.query(sql, [nota_id, nombre_original, nombre_archivo, tipo, ruta], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    eliminarArchivos(notaId) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM notas_archivos WHERE nota_id = ?";
            conx.query(sql, [parseInt(notaId)], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = NotaModel;