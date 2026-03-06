const express = require("express");                                     
const router = express.Router();                                                                                                
const ConfiguracionController = require("../controllers/configuracionController");
const configuracionController = new ConfiguracionController();
                                                                   
// Middleware para verificar que sea admin
function verificarAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        next();
    } else {
        res.redirect("/login");
    }
}

router.get("/admin/configuracion", verificarAdmin, (req, res) => configuracionController.mostrarFormulario(req, res));
router.post("/admin/configuracion", verificarAdmin, (req, res) => configuracionController.actualizarPrecio(req, res));

module.exports = router;