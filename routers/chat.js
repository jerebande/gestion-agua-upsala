// routers/chat.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ChatController = require("../controllers/chat");
const chatController = new ChatController();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../public/uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.use((req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }
    next();
});

router.get("/chat/grupal", (req, res) => chatController.mostrarChatGrupal(req, res));
router.get("/chat/privado/:userId", (req, res) => chatController.mostrarChatPrivado(req, res));
router.post("/chat/subir", upload.single("archivo"), (req, res) => chatController.subirArchivo(req, res));
router.delete("/mensaje/:mensajeId", (req, res) => chatController.eliminarMensaje(req, res));
router.get("/api/no-leidos", (req, res) => chatController.obtenerNoLeidosAPI(req, res));

module.exports = router;