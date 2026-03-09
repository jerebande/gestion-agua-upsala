const NotaModel = require("../models/notas");
const notaModel = new NotaModel();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../public/uploads/notas");
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

const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
];

const fileFilter = (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de archivo no permitido. Solo imágenes, videos, PDF, Word, Excel, PowerPoint y texto."));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: fileFilter
}).array("archivos", 10);

function getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('word') || mimetype.includes('msword')) return 'word';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'excel';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'powerpoint';
    return 'document';
}

class NotasController {
    async actualizarCliente(req, res) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "No autorizado" });
    }
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;
    const usuarioId = req.session.usuario.id;
    const rol = req.session.usuario.rol;

    try {
        // Verificar que el cliente exista y pertenezca al usuario si no es admin
        let cliente;
        if (rol === 'admin') {
            cliente = await clienteModel.obtenerClientePorId(id); // necesitamos este método
        } else {
            cliente = await clienteModel.obtenerClientePorIdYUsuario(id, usuarioId);
        }
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado o no tiene permiso" });
        }

        await clienteModel.actualizarCliente(id, { nombre, direccion, telefono });
        res.json({ success: true });
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
    async listarMisNotas(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        try {
            const usuarioId = req.session.usuario.id;
            const buscar = req.query.q || '';
            const pagina = parseInt(req.query.page) || 1;
            const limite = 5;
            const offset = (pagina - 1) * limite;
            
            // Obtener tipos de archivo seleccionados
            const tipos = req.query.tipo 
                ? (Array.isArray(req.query.tipo) ? req.query.tipo : [req.query.tipo])
                : [];

            const totalNotas = await notaModel.contarNotas(usuarioId, 'misnotas', buscar, tipos);
            const notas = await notaModel.obtenerPorUsuario(usuarioId, buscar, offset, limite, tipos);

            for (let nota of notas) {
                nota.archivos = await notaModel.obtenerArchivos(nota.id);
            }

            res.render("notas/index", {
                notas,
                nombreUsuario: req.session.usuario.nombre,
                usuarioRol: req.session.usuario.rol,
                usuarioId,
                vista: 'misnotas',
                buscar,
                tiposSeleccionados: tipos,
                paginaActual: pagina,
                totalPaginas: Math.ceil(totalNotas / limite)
            });
        } catch (error) {
            console.error("Error al obtener mis notas:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async listar(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        try {
            const usuarioId = req.session.usuario.id;
            const buscar = req.query.q || '';
            const pagina = parseInt(req.query.page) || 1;
            const limite = 5;
            const offset = (pagina - 1) * limite;

            const tipos = req.query.tipo 
                ? (Array.isArray(req.query.tipo) ? req.query.tipo : [req.query.tipo])
                : [];

            const totalNotas = await notaModel.contarNotas(usuarioId, 'feed', buscar, tipos);
            const notas = await notaModel.obtenerFeed(usuarioId, buscar, offset, limite, tipos);

            for (let nota of notas) {
                nota.archivos = await notaModel.obtenerArchivos(nota.id);
            }

            res.render("notas/index", {
                notas,
                nombreUsuario: req.session.usuario.nombre,
                usuarioRol: req.session.usuario.rol,
                usuarioId,
                vista: 'feed',
                buscar,
                tiposSeleccionados: tipos,
                paginaActual: pagina,
                totalPaginas: Math.ceil(totalNotas / limite)
            });
        } catch (error) {
            console.error("Error al obtener notas:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async mostrarFormularioCrear(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        res.render("notas/form", {
            nota: null,
            nombreUsuario: req.session.usuario.nombre,
            usuarioRol: req.session.usuario.rol
        });
    }

    async guardar(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).render("notas/form", {
                    error: err.message,
                    nota: req.body,
                    nombreUsuario: req.session.usuario.nombre,
                    usuarioRol: req.session.usuario.rol
                });
            }

            const { titulo, contenido, compartida } = req.body;
            const usuario_id = req.session.usuario.id;

            if (!titulo || !contenido) {
                return res.status(400).render("notas/form", {
                    error: "Título y contenido son obligatorios",
                    nota: { titulo, contenido, compartida: compartida === "on" }
                });
            }

            try {
                const result = await notaModel.crear({
                    usuario_id,
                    titulo,
                    contenido,
                    compartida: compartida === "on" ? 1 : 0
                });
                const notaId = result.insertId;

                if (req.files && req.files.length > 0) {
                    for (const file of req.files) {
                        const tipo = getFileType(file.mimetype);
                        const ruta = "/uploads/notas/" + file.filename;
                        await notaModel.guardarArchivo({
                            nota_id: notaId,
                            nombre_original: file.originalname,
                            nombre_archivo: file.filename,
                            tipo,
                            ruta
                        });
                    }
                }

                res.redirect("/notas");
            } catch (error) {
                console.error("Error al guardar nota:", error);
                res.status(500).send("Error del servidor");
            }
        });
    }

    async mostrarFormularioEditar(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const { id } = req.params;
        const notaId = parseInt(id);

        if (isNaN(notaId)) {
            return res.status(400).send("ID de nota inválido");
        }

        try {
            const nota = await notaModel.obtenerPorId(notaId);
            if (!nota) {
                return res.status(404).send("Nota no encontrada");
            }

            const usuario = req.session.usuario;
            const esAdmin = usuario.rol === 'admin';
            const esAutor = nota.usuario_id === usuario.id;

            if (!esAutor && !(esAdmin && nota.compartida)) {
                return res.status(403).send("No tienes permiso para editar esta nota");
            }

            res.render("notas/form", {
                nota,
                nombreUsuario: usuario.nombre,
                usuarioRol: usuario.rol
            });
        } catch (error) {
            console.error("Error al cargar nota:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async actualizar(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).render("notas/form", {
                    error: err.message,
                    nota: req.body,
                    nombreUsuario: req.session.usuario.nombre,
                    usuarioRol: req.session.usuario.rol
                });
            }

            const { id } = req.params;
            const notaId = parseInt(id);
            const { titulo, contenido, compartida } = req.body;

            if (!titulo || !contenido) {
                return res.status(400).render("notas/form", {
                    error: "Título y contenido son obligatorios",
                    nota: { id: notaId, titulo, contenido, compartida: compartida === "on" }
                });
            }

            try {
                const nota = await notaModel.obtenerPorId(notaId);
                if (!nota) return res.status(404).send("Nota no encontrada");

                const usuario = req.session.usuario;
                const esAdmin = usuario.rol === 'admin';
                const esAutor = nota.usuario_id === usuario.id;

                if (!esAutor && !(esAdmin && nota.compartida)) {
                    return res.status(403).send("No tienes permiso para editar esta nota");
                }

                await notaModel.actualizar(notaId, {
                    titulo,
                    contenido,
                    compartida: compartida === "on" ? 1 : 0
                });

                if (req.files && req.files.length > 0) {
                    const archivosViejos = await notaModel.obtenerArchivos(notaId);
                    for (const arch of archivosViejos) {
                        const filePath = path.join(__dirname, "../public", arch.ruta);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }
                    await notaModel.eliminarArchivos(notaId);

                    for (const file of req.files) {
                        const tipo = getFileType(file.mimetype);
                        const ruta = "/uploads/notas/" + file.filename;
                        await notaModel.guardarArchivo({
                            nota_id: notaId,
                            nombre_original: file.originalname,
                            nombre_archivo: file.filename,
                            tipo,
                            ruta
                        });
                    }
                }

                res.redirect("/notas");
            } catch (error) {
                console.error("Error al actualizar nota:", error);
                res.status(500).send("Error del servidor");
            }
        });
    }

    async eliminar(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const { id } = req.params;
        const notaId = parseInt(id);

        try {
            const nota = await notaModel.obtenerPorId(notaId);
            if (!nota) return res.status(404).send("Nota no encontrada");

            const usuario = req.session.usuario;
            const esAdmin = usuario.rol === 'admin';
            const esAutor = nota.usuario_id === usuario.id;

            if (!esAutor && !(esAdmin && nota.compartida)) {
                return res.status(403).send("No tienes permiso para eliminar esta nota");
            }

            const archivos = await notaModel.obtenerArchivos(notaId);
            for (const arch of archivos) {
                const filePath = path.join(__dirname, "../public", arch.ruta);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }

            await notaModel.eliminar(notaId);
            res.redirect("/notas");
        } catch (error) {
            console.error("Error al eliminar nota:", error);
            res.status(500).send("Error del servidor");
        }
    }
}

module.exports = NotasController;