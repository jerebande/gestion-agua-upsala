// models/usuarios.js
const pool = require("../database/db");
const bcrypt = require("bcryptjs");
const saltRounds = 10; // factor de costo para el hash

class UsuarioModel {
    async obtenerUsuariosRechazados() {
        const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'rechazado'";
        const [rows] = await pool.query(sql);
        return rows;
    }

    async actualizarPermiso(usuarioId, estado) {
        const sql = "UPDATE usuarios SET estado_permiso = ? WHERE id = ?";
        const [result] = await pool.query(sql, [estado, usuarioId]);
        return result;
    }

    async obtenerUsuariosPendientes() {
        const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'pendiente'";
        const [rows] = await pool.query(sql);
        return rows;
    }

    async guardar(datos, precioDefecto = 0) {
        const hash = await bcrypt.hash(datos.contraseña, saltRounds);
        const sql = "INSERT INTO usuarios (nombre, gmail, contraseña, rol, estado_permiso, precio_bidon) VALUES (?, ?, ?, 'usuario', 'pendiente', ?)";
        const [result] = await pool.query(sql, [datos.nombre, datos.gmail, hash, precioDefecto]);
        return result;
    }

    async validarUsuario(gmail, contraseña) {
        const sql = "SELECT * FROM usuarios WHERE gmail = ?";
        const [rows] = await pool.query(sql, [gmail]);
        if (rows.length === 0) return null;

        const usuario = rows[0];
        let match = false;

        // Detectar si la contraseña almacenada es un hash bcrypt (empieza con $2a$ o $2b$)
        if (usuario.contraseña.startsWith('$2a$') || usuario.contraseña.startsWith('$2b$')) {
            match = await bcrypt.compare(contraseña, usuario.contraseña);
        } else {
            // Contraseña en texto plano: comparación directa y migración automática
            match = (contraseña === usuario.contraseña);
            if (match) {
                const hash = await bcrypt.hash(contraseña, saltRounds);
                await pool.query('UPDATE usuarios SET contraseña = ? WHERE id = ?', [hash, usuario.id]);
                console.log(`Contraseña migrada a hash para usuario ${usuario.id}`);
            }
        }

        return match ? usuario : null;
    }

    async obtenerUsuario(id) {
        const sql = "SELECT * FROM usuarios WHERE id = ?";
        const [rows] = await pool.query(sql, [id]);
        return rows.length > 0 ? rows[0] : false;
    }

    async validarUsuarioPorEmail(gmail) {
        const sql = "SELECT * FROM usuarios WHERE gmail = ?";
        const [rows] = await pool.query(sql, [gmail]);
        return rows.length > 0;
    }

    async obtenerUsuarios() {
        const sql = "SELECT id, nombre, gmail FROM usuarios WHERE rol IN ('usuario', 'admin') ORDER BY nombre";
        const [rows] = await pool.query(sql);
        return rows;
    }

    async obtenerPrecioUsuario(usuarioId) {
        const sql = "SELECT precio_bidon FROM usuarios WHERE id = ?";
        const [rows] = await pool.query(sql, [usuarioId]);
        if (rows.length > 0) {
            return rows[0].precio_bidon;
        }
        return 0;
    }

    async actualizarPrecioUsuario(usuarioId, nuevoPrecio) {
        const sql = "UPDATE usuarios SET precio_bidon = ? WHERE id = ?";
        const [result] = await pool.query(sql, [nuevoPrecio, usuarioId]);
        return result;
    }

    // Métodos para clientes (se mantienen igual)
    async obtenerClientePorId(id) {
        const sql = "SELECT * FROM clientes WHERE id = ?";
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    async obtenerClientePorIdYUsuario(id, usuarioId) {
        const sql = `
            SELECT c.* 
            FROM clientes c 
            INNER JOIN usuario_cliente uc ON c.id = uc.cliente_id 
            WHERE c.id = ? AND uc.usuario_id = ?
        `;
        const [rows] = await pool.query(sql, [id, usuarioId]);
        return rows[0];
    }

    async actualizarCliente(id, datos) {
        const sql = "UPDATE clientes SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?";
        const [result] = await pool.query(sql, [datos.nombre, datos.direccion, datos.telefono, id]);
        return result;
    }
}

module.exports = UsuarioModel;