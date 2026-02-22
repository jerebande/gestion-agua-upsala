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
router.get("/home", (req, res) => usuarioController.home(req, res));

router.get("/home", (req, res) => {
    const nombreUsuario = req.session.usuario ? req.session.usuario.nombre : null;
    console.log("Nombre del usuario en sesión:", nombreUsuario); 
    res.render("index", { nombreUsuario });
});


router.post("/registro", (req, res) => usuarioController.guardarUsuario(req, res));
router.get("/login",(req,res)=>{
    res.render("login")
})

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("No se pudo cerrar sesión.");
        }
        res.redirect("/login");
    });
});

router.get("/registro",(req,res)=>{
    res.render("crearcuenta")
})
router.post("/login", (req, res) => usuarioController.loginUsuario(req, res));

module.exports = router;
