const express = require("express");
const router = express.Router();
const UsuarioController = require("../controllers/usuarios");
const usuarioController = new UsuarioController();

// Middleware solo admin
function soloAdmin(req, res, next) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).redirect("/login");
    }
    next();
}

// =============================================
// GESTIÓN DE USUARIOS (NUEVO)
// =============================================
router.get("/admin/usuarios", soloAdmin, (req, res) => usuarioController.mostrarGestionUsuarios(req, res));
router.post("/admin/bloquear-usuario/:id", soloAdmin, (req, res) => usuarioController.bloquearUsuario(req, res));
router.post("/admin/desbloquear-usuario/:id", soloAdmin, (req, res) => usuarioController.desbloquearUsuario(req, res));
router.post("/admin/eliminar-usuario/:id", soloAdmin, (req, res) => usuarioController.eliminarUsuario(req, res));

// =============================================
// INVITACIONES
// =============================================
router.get("/admin/invitaciones", (req, res) => usuarioController.verInvitaciones(req, res));

router.post("/admin/aceptar-usuario/:id", soloAdmin, (req, res) => {
    req.body.accion = 'aceptado';
    usuarioController.procesarInvitacion(req, res);
});

router.post("/admin/rechazar-usuario/:id", soloAdmin, (req, res) => {
    req.body.accion = 'rechazado';
    usuarioController.procesarInvitacion(req, res);
});

// =============================================
// HOME
// =============================================
router.get("/home", (req, res) => {
    if (!req.session.usuario) return res.redirect("/login");
    usuarioController.home(req, res);
});

// =============================================
// AUTH
// =============================================
router.post("/registro", (req, res) => usuarioController.guardarUsuario(req, res));

router.get("/login", (req, res) => {
    if (req.session.usuario) return res.redirect("/home");
    res.render("login", { error: null });
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("No se pudo cerrar sesión.");
        res.redirect("/login");
    });
});

router.get("/registro", (req, res) => {
    res.render("crearcuenta", { error: null });
});

router.post("/login", (req, res) => usuarioController.loginUsuario(req, res));

module.exports = router;