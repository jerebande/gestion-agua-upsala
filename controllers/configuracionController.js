// controllers/configuracionController.js
const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();

class ConfiguracionController {
    // Muestra el formulario con el precio del usuario actual
    async mostrarFormulario(req, res) {
        if (!req.session.usuario) {
            return res.redirect("/login");
        }
        try {
            const usuarioId = req.session.usuario.id;
            const precio = await usuarioModel.obtenerPrecioUsuario(usuarioId);

            const nombreUsuario = req.session.usuario.nombre;
            const usuarioRol = req.session.usuario.rol;

            res.render("configuracion", { 
                precio, 
                nombreUsuario,
                usuarioRol,
                usuarioId
            });
        } catch (error) {
            console.error("Error al obtener precio:", error);
            res.status(500).send("Error del servidor");
        }
    }

    // Actualiza el precio del usuario actual
    async actualizarPrecio(req, res) {
        if (!req.session.usuario) {
            return res.redirect("/login");
        }
        const { precio_bidon } = req.body;
        if (!precio_bidon || isNaN(precio_bidon)) {
            return res.status(400).send("El precio es obligatorio y debe ser un número.");
        }
        try {
            const usuarioId = req.session.usuario.id;
            await usuarioModel.actualizarPrecioUsuario(usuarioId, precio_bidon);
            res.redirect("/home");
        } catch (error) {
            console.error("Error al actualizar precio:", error);
            res.status(500).send("Error del servidor");
        }
    }
}

module.exports = ConfiguracionController;