// routers/routerconf.js
const express = require("express");
const router = express.Router();
const ConfiguracionController = require("../controllers/configuracionController");
const configuracionController = new ConfiguracionController();

// Middleware para verificar que el usuario esté autenticado (cualquier rol)
function verificarAutenticado(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Rutas de configuración accesibles para cualquier usuario autenticado
router.get("/configuracion", verificarAutenticado, (req, res) => configuracionController.mostrarFormulario(req, res));
router.post("/configuracion", verificarAutenticado, (req, res) => configuracionController.actualizarPrecio(req, res));

module.exports = router;