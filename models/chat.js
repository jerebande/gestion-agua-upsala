// models/chat.js
const pool = require("../database/db");
const fs = require("fs").promises;
const path = require("path");

class ChatModel {
    async guardarMensaje(mensaje) {
        const sql = `
            INSERT INTO mensajes_chat 
            (remitente_id, destinatario_id, tipo_mensaje, contenido) 
            VALUES (?, ?, ?, ?)
        `;
        const { remitente_id, destinatario_id, tipo_mensaje, contenido } = mensaje;
        const [result] = await pool.query(sql, [
            remitente_id,
            destinatario_id || null,
            tipo_mensaje,
            contenido
        ]);
        return result;
    }

    async obtenerMensajes(destinatarioId = null, usuarioId = null, limite = 50) {
        let sql;
        let params = [];

        if (destinatarioId === null) {
            sql = `
                SELECT m.*, u.nombre AS remitente_nombre 
                FROM mensajes_chat m
                JOIN usuarios u ON m.remitente_id = u.id
                WHERE m.destinatario_id IS NULL
                ORDER BY m.fecha_envio DESC
                LIMIT ?
            `;
            params = [limite];
        } else {
            sql = `
                SELECT m.*, u.nombre AS remitente_nombre 
                FROM mensajes_chat m
                JOIN usuarios u ON m.remitente_id = u.id
                WHERE (m.remitente_id = ? AND m.destinatario_id = ?)
                   OR (m.remitente_id = ? AND m.destinatario_id = ?)
                ORDER BY m.fecha_envio DESC
                LIMIT ?
            `;
            params = [usuarioId, destinatarioId, destinatarioId, usuarioId, limite];
        }

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async obtenerUsuarios() {
        const sql = "SELECT id, nombre, gmail FROM usuarios WHERE rol = 'usuario' OR rol = 'admin' ORDER BY nombre";
        const [rows] = await pool.query(sql);
        return rows;
    }

    async obtenerUltimoLeido(usuarioId, tipo, otroUsuarioId = 0) {
        const sql = "SELECT ultimo_mensaje_id FROM mensajes_leidos WHERE usuario_id = ? AND chat_tipo = ? AND otro_usuario_id = ?";
        const [rows] = await pool.query(sql, [usuarioId, tipo, otroUsuarioId]);
        return rows.length ? rows[0].ultimo_mensaje_id : 0;
    }

    async actualizarUltimoLeido(usuarioId, tipo, otroUsuarioId, mensajeId) {
        const sql = `
            INSERT INTO mensajes_leidos (usuario_id, chat_tipo, otro_usuario_id, ultimo_mensaje_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ultimo_mensaje_id = ?
        `;
        const [result] = await pool.query(sql, [usuarioId, tipo, otroUsuarioId, mensajeId, mensajeId]);
        return result;
    }

    async obtenerNoLeidos(usuarioId) {
        const sql = `
            -- Mensajes grupales no leídos (otro_id = 0)
            SELECT 'grupal' AS tipo, 0 AS otro_id, COUNT(*) AS no_leidos
            FROM mensajes_chat m
            WHERE m.destinatario_id IS NULL
              AND m.remitente_id != ?
              AND m.id > IFNULL(
                  (SELECT ultimo_mensaje_id FROM mensajes_leidos 
                   WHERE usuario_id = ? AND chat_tipo = 'grupal' AND otro_usuario_id = 0), 0)
            
            UNION ALL
            
            -- Mensajes privados no leídos (agrupados por el otro usuario)
            SELECT 'privado' AS tipo, 
                   CASE WHEN m.remitente_id = ? THEN m.destinatario_id ELSE m.remitente_id END AS otro_id,
                   COUNT(*) AS no_leidos
            FROM mensajes_chat m
            WHERE m.destinatario_id IS NOT NULL
              AND m.remitente_id != ?
              AND m.id > IFNULL(
                  (SELECT ultimo_mensaje_id FROM mensajes_leidos 
                   WHERE usuario_id = ? AND chat_tipo = 'privado' 
                     AND otro_usuario_id = CASE WHEN m.remitente_id = ? THEN m.destinatario_id ELSE m.remitente_id END), 0)
            GROUP BY otro_id
        `;
        const [rows] = await pool.query(sql, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]);
        return rows.filter(r => r.no_leidos > 0);
    }

    async obtenerMensajePorId(mensajeId) {
        const sql = "SELECT tipo_mensaje, contenido FROM mensajes_chat WHERE id = ?";
        const [rows] = await pool.query(sql, [mensajeId]);
        return rows.length ? rows[0] : null;
    }

    async eliminarMensaje(mensajeId, usuarioId, esAdmin) {
        try {
            const mensaje = await this.obtenerMensajePorId(mensajeId);
            
            let sql;
            let params;
            if (esAdmin) {
                sql = "DELETE FROM mensajes_chat WHERE id = ?";
                params = [mensajeId];
            } else {
                sql = "DELETE FROM mensajes_chat WHERE id = ? AND remitente_id = ?";
                params = [mensajeId, usuarioId];
            }
            
            const [result] = await pool.query(sql, params);
            const eliminado = result.affectedRows > 0;
            
            if (eliminado && mensaje && ['imagen', 'video', 'archivo'].includes(mensaje.tipo_mensaje)) {
                try {
                    const url = mensaje.contenido;
                    const fileName = path.basename(url);
                    const filePath = path.join(__dirname, '../public/uploads', fileName);
                    
                    await fs.access(filePath);
                    await fs.unlink(filePath);
                    console.log(`Archivo eliminado: ${filePath}`);
                } catch (fileErr) {
                    console.error('Error al eliminar archivo físico:', fileErr);
                }
            }
            
            return eliminado;
        } catch (error) {
            console.error('Error en eliminarMensaje:', error);
            throw error;
        }
    }

    // NUEVOS MÉTODOS PARA LA LISTA DE CHATS
    async obtenerUltimosMensajesPrivados(usuarioId) {
        const sql = `
            SELECT 
                CASE WHEN remitente_id = ? THEN destinatario_id ELSE remitente_id END AS otro_id,
                MAX(fecha_envio) AS ultima_fecha,
                SUBSTRING(contenido, 1, 50) AS ultimo_contenido,
                tipo_mensaje AS ultimo_tipo
            FROM mensajes_chat
            WHERE (remitente_id = ? OR destinatario_id = ?) AND destinatario_id IS NOT NULL
            GROUP BY otro_id
            ORDER BY ultima_fecha DESC
        `;
        const [rows] = await pool.query(sql, [usuarioId, usuarioId, usuarioId]);
        return rows;
    }

    async obtenerUltimoMensajeGrupal() {
        const sql = `
            SELECT contenido, tipo_mensaje, fecha_envio
            FROM mensajes_chat
            WHERE destinatario_id IS NULL
            ORDER BY fecha_envio DESC
            LIMIT 1
        `;
        const [rows] = await pool.query(sql);
        return rows.length ? rows[0] : null;
    }
}

module.exports = ChatModel;