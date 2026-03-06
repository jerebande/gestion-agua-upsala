const express = require("express");
const router = express.Router();
const NotasController = require("../controllers/notasController");
const notasController = new NotasController();

// Middleware de autenticación para todas las rutas
router.use((req, res, next) => {
    if (!req.session.usuario) return res.redirect("/login");
    next();
});
router.get("/mis-notas", (req, res) => notasController.listarMisNotas(req, res));
router.get("/", (req, res) => notasController.listar(req, res));
router.get("/crear", (req, res) => notasController.mostrarFormularioCrear(req, res));
router.post("/", (req, res) => notasController.guardar(req, res));
router.get("/:id/editar", (req, res) => notasController.mostrarFormularioEditar(req, res));
router.post("/:id", (req, res) => notasController.actualizar(req, res));
router.post("/:id/eliminar", (req, res) => notasController.eliminar(req, res));

module.exports = router;