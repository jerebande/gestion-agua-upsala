const express = require("express");
const router = express.Router();
const UsuarioController = require("../controllers/usuarios");
const usuarioController = new UsuarioController();

// Vista de usuarios pendientes
router.get("/admin/invitaciones", (req, res) => usuarioController.verInvitaciones(req, res));

// Aceptar usuario (cambia estado a 'aceptado')
router.post("/admin/aceptar-usuario/:id", (req, res) => {
    req.body.accion = 'aceptado';
    usuarioController.procesarInvitacion(req, res);
});

// Rechazar usuario (cambia estado a 'rechazado')
router.post("/admin/rechazar-usuario/:id", (req, res) => {
    req.body.accion = 'rechazado';
    usuarioController.procesarInvitacion(req, res);
});

// Ruta principal (home) - debe estar autenticado
router.get("/home", (req, res) => {
    // Verificar si el usuario está en sesión
    if (!req.session.usuario) {
        return res.redirect("/login");
    }
    // Llamar al controlador que se encarga de obtener los clientes y renderizar
    usuarioController.home(req, res);
});

// Ruta de registro (POST)
router.post("/registro", (req, res) => usuarioController.guardarUsuario(req, res));

// Ruta de login (GET)
router.get("/login", (req, res) => {
    res.render("login");
});

// Ruta de logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("No se pudo cerrar sesión.");
        }
        res.redirect("/login");
    });
});

// Ruta de registro (GET)
router.get("/registro", (req, res) => {
    res.render("crearcuenta");
});

// Ruta de login (POST)
router.post("/login", (req, res) => usuarioController.loginUsuario(req, res));

module.exports = router;