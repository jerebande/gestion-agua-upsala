const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const session = require("express-session");
const path = require("path");
const fs = require("fs");

// Importar rutas
const notasRoutes = require("./routers/notas");
const routerusuarios = require("./routers/usuarios");
const routerclientes = require("./routers/clientes");
const routerconf = require("./routers/routerconf");
const routerchat = require("./routers/chat");

const port = 3000;

// Configuración de sesión
const sessionMiddleware = session({
    secret: "mi_secreto_seguro",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
});
app.use(sessionMiddleware);

// Compartir sesión con Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Archivos estáticos
app.use('/public', express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Motor de vistas
app.set("view engine", "ejs");

// Rutas
app.use("/", routerconf);
app.use("/", routerusuarios);
app.use("/", routerclientes);
app.use("/", routerchat);
app.use("/notas", notasRoutes);

// Mapa de usuarios conectados (opcional)
const usuariosConectados = new Map();

// Socket.IO
io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    const session = socket.request.session;
    const usuario = session.usuario;

    if (!usuario) {
        console.log("Usuario no autenticado, desconectando");
        socket.disconnect();
        return;
    }

    usuariosConectados.set(socket.id, {
        userId: usuario.id,
        nombre: usuario.nombre
    });

    socket.join("grupo");
    socket.join(`user-${usuario.id}`);

    socket.on("join-private", ({ usuarioId, otroUsuarioId }) => {
        const roomName = getPrivateRoomName(usuarioId, otroUsuarioId);
        socket.join(roomName);
    });

    socket.on("send-message", async (mensaje) => {
        if (!mensaje.fecha_envio) {
            mensaje.fecha_envio = new Date().toISOString();
        }

        const ChatModel = require("./models/chat");
        const chatModel = new ChatModel();
        try {
            const result = await chatModel.guardarMensaje({
                remitente_id: mensaje.remitente_id,
                destinatario_id: mensaje.destinatario_id || null,
                tipo_mensaje: mensaje.tipo_mensaje,
                contenido: mensaje.contenido
            });
            mensaje.id = result.insertId;
        } catch (error) {
            console.error("Error guardando mensaje:", error);
            return;
        }

        if (mensaje.destinatario_id === null) {
            // Mensaje grupal
            io.to("grupo").emit("receive-message", mensaje);
            io.to("grupo").emit("update-unread"); // Actualiza badges de todos en el grupo
        } else {
            // Mensaje privado
            const roomName = getPrivateRoomName(mensaje.remitente_id, mensaje.destinatario_id);
            io.to(roomName).emit("receive-message", mensaje);

            // Actualizar badges de ambos usuarios (incluso si no están en la sala privada)
            io.to(`user-${mensaje.remitente_id}`).emit("update-unread");
            io.to(`user-${mensaje.destinatario_id}`).emit("update-unread");
        }
    });

    socket.on("marcar-leido", async (data) => {
        const usuario = socket.request.session.usuario;
        if (!usuario) return;
        try {
            const ChatModel = require("./models/chat");
            const chatModel = new ChatModel();
            const otroId = data.tipo === 'grupal' ? 0 : data.otroUsuarioId;
            await chatModel.actualizarUltimoLeido(usuario.id, data.tipo, otroId, data.ultimoMensajeId);
            // Emitir al usuario que sus no leídos han cambiado (para actualizar todas sus pestañas)
            io.to(`user-${usuario.id}`).emit('update-unread');
        } catch (error) {
            console.error("Error marcando leído:", error);
        }
    });

    socket.on("delete-message", (mensajeId) => {
        const usuario = socket.request.session.usuario;
        if (!usuario) return;
        
        io.emit('message-deleted', mensajeId);
    });

    socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
        usuariosConectados.delete(socket.id);
    });
});

function getPrivateRoomName(id1, id2) {
    return [id1, id2].sort().join("-");
}

server.listen(port, () => {
    console.log(`Servidor corriendo en ${port}`);
});