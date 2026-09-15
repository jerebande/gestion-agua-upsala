// routers/asistente.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const AsistenteController = require("../controllers/asistenteController");
const asistenteController = new AsistenteController();

// Audio en memoria (no se guarda en disco, solo se reenvía a Groq para transcribir)
const uploadAudio = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// Middleware: cualquier usuario autenticado
router.use((req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }
    next();
});

router.get("/asistente", (req, res) => asistenteController.mostrarAsistente(req, res));
router.post("/api/asistente/mensaje", (req, res) => asistenteController.procesarMensaje(req, res));
router.post("/api/asistente/audio", uploadAudio.single("audio"), (req, res) => asistenteController.procesarAudio(req, res));

module.exports = router;