// models/usuarios.js
const pool = require("../database/db");

class UsuarioModel {
    // Obtener usuarios rechazados
    async obtenerUsuariosRechazados() {
        const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'rechazado'";
        const [rows] = await pool.query(sql);
        return rows;
    }

    // Actualizar permiso de usuario
    async actualizarPermiso(usuarioId, estado) {
        const sql = "UPDATE usuarios SET estado_permiso = ? WHERE id = ?";
        const [result] = await pool.query(sql, [estado, usuarioId]);
        return result;
    }

    // Obtener usuarios pendientes de aprobación
    async obtenerUsuariosPendientes() {
        const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'pendiente'";
        const [rows] = await pool.query(sql);
        return rows;
    }

    // Guardar un nuevo cliente (tabla clientes)
    async guardarCliente(cliente) {
        const sql = "INSERT INTO clientes (nombre, direccion, telefono, estado_pago) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(sql, [cliente.nombre, cliente.direccion, cliente.telefono, cliente.estado_pago]);
        return result;
    }

    // Obtener todos los clientes
    async obtenerClientes() {
        const sql = "SELECT * FROM clientes";
        const [rows] = await pool.query(sql);
        return rows;
    }

    // Validar usuario por email y contraseña
    async validarUsuario(gmail, contraseña) {
        const sql = "SELECT * FROM usuarios WHERE gmail = ? AND contraseña = ?";
        const [rows] = await pool.query(sql, [gmail, contraseña]);
        return rows.length > 0 ? rows[0] : null;
    }

    // Obtener un usuario por su ID
    async obtenerUsuario(id) {
        const sql = "SELECT * FROM usuarios WHERE id = ?";
        const [rows] = await pool.query(sql, [id]);
        return rows.length > 0 ? rows[0] : false;
    }

    // Guardar un nuevo usuario (con rol 'usuario' y estado 'pendiente')
    async guardar(datos) {
        const sql = "INSERT INTO usuarios (nombre, gmail, contraseña, rol, estado_permiso) VALUES (?, ?, ?, 'usuario', 'pendiente')";
        const [result] = await pool.query(sql, [datos.nombre, datos.gmail, datos.contraseña]);
        return result;
    }

    // Verificar si ya existe un usuario con el mismo email
    async validarUsuarioPorEmail(gmail) {
        const sql = "SELECT * FROM usuarios WHERE gmail = ?";
        const [rows] = await pool.query(sql, [gmail]);
        return rows.length > 0;
    }

    // Obtener todos los usuarios (para el chat y otras funciones)
    async obtenerUsuarios() {
        const sql = "SELECT id, nombre, gmail FROM usuarios WHERE rol IN ('usuario', 'admin') ORDER BY nombre";
        const [rows] = await pool.query(sql);
        return rows;
    }

    // ----- NUEVOS MÉTODOS PARA CLIENTES -----
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