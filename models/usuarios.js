const pool = require("../database/db");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

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

    // =============================================
    // MÉTODOS NUEVOS
    // =============================================

    async obtenerTodosLosUsuarios() {
        const sql = `
            SELECT id, nombre, gmail, rol, estado_permiso 
            FROM usuarios
            ORDER BY 
                CASE estado_permiso 
                    WHEN 'pendiente'  THEN 0 
                    WHEN 'bloqueado'  THEN 1 
                    WHEN 'aceptado'   THEN 2 
                    ELSE 3 
                END, nombre ASC
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async bloquearUsuario(usuarioId) {
        const sql = "UPDATE usuarios SET estado_permiso = 'bloqueado' WHERE id = ? AND rol != 'admin'";
        const [result] = await pool.query(sql, [usuarioId]);
        return result;
    }

    async desbloquearUsuario(usuarioId) {
        const sql = "UPDATE usuarios SET estado_permiso = 'aceptado' WHERE id = ? AND rol != 'admin'";
        const [result] = await pool.query(sql, [usuarioId]);
        return result;
    }

    async eliminarUsuario(usuarioId) {
        const sql = "DELETE FROM usuarios WHERE id = ? AND rol != 'admin'";
        const [result] = await pool.query(sql, [usuarioId]);
        return result;
    }

    async obtenerEstadisticas() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado_permiso = 'aceptado'  THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado_permiso = 'bloqueado' THEN 1 ELSE 0 END) as bloqueados,
                SUM(CASE WHEN estado_permiso = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM usuarios
        `;
        const [rows] = await pool.query(sql);
        return rows[0];
    }

    // =============================================
    // MÉTODOS EXISTENTES (sin cambios)
    // =============================================

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

        if (usuario.contraseña.startsWith('$2a$') || usuario.contraseña.startsWith('$2b$')) {
            match = await bcrypt.compare(contraseña, usuario.contraseña);
        } else {
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
        if (rows.length > 0) return rows[0].precio_bidon;
        return 0;
    }

    async actualizarPrecioUsuario(usuarioId, nuevoPrecio) {
        const sql = "UPDATE usuarios SET precio_bidon = ? WHERE id = ?";
        const [result] = await pool.query(sql, [nuevoPrecio, usuarioId]);
        return result;
    }

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
