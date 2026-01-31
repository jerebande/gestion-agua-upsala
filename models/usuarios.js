const conx = require("../database/db");

class UsuarioModel {
    guardarCliente(cliente) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO clientes (nombre, direccion, telefono, estado_pago) VALUES (?, ?, ?, ?)";
            conx.query(sql, [cliente.nombre, cliente.direccion, cliente.telefono, cliente.estado_pago], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    obtenerClientes() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM clientes";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    validarUsuario(gmail, contraseña) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE gmail = ? AND contraseña = ?";
            conx.query(sql, [gmail, contraseña], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }

    obtenerUsuario(id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE id = ?";
            conx.query(sql, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0] : false);
            });
        });
    }

    guardar(datos) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO usuarios (nombre, gmail, contraseña) VALUES (?, ?, ?)";
            conx.query(sql, [datos.nombre, datos.gmail, datos.contraseña], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    validarUsuarioPorEmail(gmail) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE gmail = ?";
            conx.query(sql, [gmail], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            });
        });
    }
}

module.exports = UsuarioModel;
