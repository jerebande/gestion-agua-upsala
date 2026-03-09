const conx = require("../database/db");

class UsuarioModel {
    // Obtener usuarios rechazados
    obtenerUsuariosRechazados() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'rechazado'";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Actualizar permiso de usuario
    actualizarPermiso(usuarioId, estado) {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE usuarios SET estado_permiso = ? WHERE id = ?";
            conx.query(sql, [estado, usuarioId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Obtener usuarios pendientes de aprobación
    obtenerUsuariosPendientes() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, nombre, gmail, estado_permiso FROM usuarios WHERE rol = 'usuario' AND estado_permiso = 'pendiente'";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Guardar un nuevo cliente (tabla clientes)
    guardarCliente(cliente) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO clientes (nombre, direccion, telefono, estado_pago) VALUES (?, ?, ?, ?)";
            conx.query(sql, [cliente.nombre, cliente.direccion, cliente.telefono, cliente.estado_pago], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Obtener todos los clientes
    obtenerClientes() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM clientes";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Validar usuario por email y contraseña
    validarUsuario(gmail, contraseña) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE gmail = ? AND contraseña = ?";
            conx.query(sql, [gmail, contraseña], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }

    // Obtener un usuario por su ID
    obtenerUsuario(id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE id = ?";
            conx.query(sql, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0] : false);
            });
        });
    }

    // Guardar un nuevo usuario (con rol 'usuario' y estado 'pendiente')
    guardar(datos) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO usuarios (nombre, gmail, contraseña, rol, estado_permiso) VALUES (?, ?, ?, 'usuario', 'pendiente')";
            conx.query(sql, [datos.nombre, datos.gmail, datos.contraseña], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Verificar si ya existe un usuario con el mismo email
    validarUsuarioPorEmail(gmail) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE gmail = ?";
            conx.query(sql, [gmail], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            });
        });
    }

    // Obtener todos los usuarios (para el chat y otras funciones)
    obtenerUsuarios() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, nombre, gmail FROM usuarios WHERE rol IN ('usuario', 'admin') ORDER BY nombre";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = UsuarioModel;