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
            const flash = req.session.flash || null;
            req.session.flash = null;

            res.render("configuracion", { 
                precio, 
                nombreUsuario,
                usuarioRol,
                usuarioId,
                flash
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
            req.session.flash = { tipo: 'error', mensaje: 'El precio es obligatorio y debe ser un número.' };
            return res.redirect("/configuracion");
        }
        try {
            const usuarioId = req.session.usuario.id;
            await usuarioModel.actualizarPrecioUsuario(usuarioId, precio_bidon);
            req.session.flash = { tipo: 'success', mensaje: 'Precio actualizado correctamente.' };
            res.redirect("/configuracion");
        } catch (error) {
            console.error("Error al actualizar precio:", error);
            req.session.flash = { tipo: 'error', mensaje: 'Error al actualizar el precio.' };
            res.redirect("/configuracion");
        }
    }
}

module.exports = ConfiguracionController;