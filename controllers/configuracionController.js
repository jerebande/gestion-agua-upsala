const ConfiguracionModel = require("../models/configuracion");
const configuracionModel = new ConfiguracionModel();

class ConfiguracionController {
    async mostrarFormulario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        try {
            const precio = await configuracionModel.obtenerPrecioBidon();
            
            const nombreUsuario = req.session.usuario.nombre;
            const usuarioRol = req.session.usuario.rol;
            const usuarioId = req.session.usuario.id;   // <-- AGREGADO

            res.render("configuracion", { 
                precio, 
                nombreUsuario,
                usuarioRol,
                usuarioId      // <-- AGREGADO
            });
        } catch (error) {
            console.error("Error al obtener precio:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async actualizarPrecio(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { precio_bidon } = req.body;
        if (!precio_bidon || isNaN(precio_bidon)) {
            return res.status(400).send("El precio es obligatorio y debe ser un número.");
        }
        try {
            await configuracionModel.actualizarPrecioBidon(precio_bidon);
            res.redirect("/home");
        } catch (error) {
            console.error("Error al actualizar precio:", error);
            res.status(500).send("Error del servidor");
        }
    }
}

module.exports = ConfiguracionController;