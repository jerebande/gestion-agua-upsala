const ChatModel = require("../models/chat");
const chatModel = new ChatModel();

class ChatController {
    // Método auxiliar para obtener la lista ordenada de chats
    async obtenerListaChats(usuarioId) {
        const UsuarioModel = require("../models/usuarios");
        const usuarioModel = new UsuarioModel();
        
        // Obtener todos los usuarios excepto el actual
        const todos = await usuarioModel.obtenerUsuarios();
        const otrosUsuarios = todos.filter(u => u.id != usuarioId);

        // Últimos mensajes privados
        const ultimosPrivados = await chatModel.obtenerUltimosMensajesPrivados(usuarioId);
        // Último mensaje grupal
        const ultimoGrupal = await chatModel.obtenerUltimoMensajeGrupal();
        // No leídos
        const noLeidos = await chatModel.obtenerNoLeidos(usuarioId);
        const noLeidosMap = {};
        noLeidos.forEach(item => {
            const key = item.tipo === 'grupal' ? 'grupal' : `privado-${item.otro_id}`;
            noLeidosMap[key] = item.no_leidos;
        });

        let chats = [];

        // Chat grupal
        chats.push({
            tipo: 'grupal',
            id: 0,
            nombre: 'Chat Grupal',
            avatar: 'fas fa-users',
            ultimoMensaje: ultimoGrupal ? (ultimoGrupal.tipo_mensaje === 'texto' ? ultimoGrupal.contenido : '[' + ultimoGrupal.tipo_mensaje + ']') : '',
            ultimaFecha: ultimoGrupal ? ultimoGrupal.fecha_envio : null,
            noLeidos: noLeidosMap['grupal'] || 0
        });

        // Chats privados
        otrosUsuarios.forEach(user => {
            const priv = ultimosPrivados.find(p => p.otro_id == user.id);
            chats.push({
                tipo: 'privado',
                id: user.id,
                nombre: user.nombre,
                avatar: user.nombre.charAt(0).toUpperCase(),
                ultimoMensaje: priv ? (priv.ultimo_tipo === 'texto' ? priv.ultimo_contenido : '[' + priv.ultimo_tipo + ']') : '',
                ultimaFecha: priv ? priv.ultima_fecha : null,
                noLeidos: noLeidosMap[`privado-${user.id}`] || 0
            });
        });

        // Ordenar por fecha descendente (más reciente primero)
        chats.sort((a, b) => {
            if (!a.ultimaFecha && !b.ultimaFecha) return 0;
            if (!a.ultimaFecha) return 1;
            if (!b.ultimaFecha) return -1;
            return new Date(b.ultimaFecha) - new Date(a.ultimaFecha);
        });

        // Forzar que el grupo quede siempre arriba
        const indexGrupal = chats.findIndex(c => c.tipo === 'grupal');
        if (indexGrupal > -1) {
            const grupal = chats.splice(indexGrupal, 1)[0];
            chats.unshift(grupal);
        }

        return chats;
    }

    async mostrarChatGrupal(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        try {
            let mensajes = await chatModel.obtenerMensajes(null, null, 50);
            mensajes.reverse(); // orden ascendente
            const chats = await this.obtenerListaChats(req.session.usuario.id);

            res.render("chat/group", {
                nombreUsuario: req.session.usuario.nombre,
                usuarioId: req.session.usuario.id,
                usuarioRol: req.session.usuario.rol,
                mensajes: mensajes,
                chats: chats
            });
        } catch (error) {
            console.error("Error al cargar chat grupal:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async mostrarChatPrivado(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const otroUsuarioId = req.params.userId;
        try {
            const usuarioModel = require("../models/usuarios");
            const usuario = new usuarioModel();
            const otroUsuario = await usuario.obtenerUsuario(otroUsuarioId);
            if (!otroUsuario) return res.status(404).send("Usuario no encontrado");

            let mensajes = await chatModel.obtenerMensajes(otroUsuarioId, req.session.usuario.id, 50);
            mensajes.reverse();
            const chats = await this.obtenerListaChats(req.session.usuario.id);

            res.render("chat/private", {
                nombreUsuario: req.session.usuario.nombre,
                usuarioId: req.session.usuario.id,
                usuarioRol: req.session.usuario.rol,
                otroUsuario: otroUsuario,
                mensajes: mensajes,
                chats: chats
            });
        } catch (error) {
            console.error("Error al cargar chat privado:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async subirArchivo(req, res) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: "No autorizado" });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: "No se envió ningún archivo" });
            }

            const fileUrl = `/uploads/${req.file.filename}`;
            const tipo = req.file.mimetype.startsWith("image/") ? "imagen"
                       : req.file.mimetype.startsWith("video/") ? "video"
                       : "archivo";

            res.json({
                success: true,
                url: fileUrl,
                tipo: tipo,
                nombreOriginal: req.file.originalname
            });
        } catch (error) {
            console.error("Error al subir archivo:", error);
            res.status(500).json({ error: "Error al subir archivo" });
        }
    }

    async eliminarMensaje(req, res) {
        if (!req.session.usuario) return res.status(401).json({ error: "No autorizado" });
        const { mensajeId } = req.params;
        const esAdmin = req.session.usuario.rol === 'admin';
        try {
            const eliminado = await chatModel.eliminarMensaje(mensajeId, req.session.usuario.id, esAdmin);
            if (eliminado) {
                res.json({ success: true });
            } else {
                res.status(403).json({ error: "No puedes eliminar este mensaje" });
            }
        } catch (error) {
            console.error("Error eliminando mensaje:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async obtenerNoLeidosAPI(req, res) {
        if (!req.session.usuario) return res.status(401).json({ error: "No autorizado" });
        try {
            const noLeidos = await chatModel.obtenerNoLeidos(req.session.usuario.id);
            const noLeidosMap = {};
            noLeidos.forEach(item => {
                const key = item.tipo === 'grupal' ? 'grupal' : `privado-${item.otro_id}`;
                noLeidosMap[key] = item.no_leidos;
            });
            res.json(noLeidosMap);
        } catch (error) {
            console.error("Error obteniendo no leídos:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }
}

module.exports = ChatController;