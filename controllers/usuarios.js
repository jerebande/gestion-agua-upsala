const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const ClienteModel = require("../models/clientes");
const clienteModel = new ClienteModel();

class UsuarioController {
    async mostrarInvitaciones(req, res) {
        try {
            const usuariosPendientes = await usuarioModel.obtenerUsuariosPendientes();
            const usuariosRechazados = await usuarioModel.obtenerUsuariosRechazados();
            
            res.render("invitaciones", { 
                usuariosPendientes, 
                usuariosRechazados,                                
                nombreUsuario: req.session.usuario ? req.session.usuario.nombre : null,
                usuarioRol: req.session.usuario ? req.session.usuario.rol : null,
                usuarioId: req.session.usuario ? req.session.usuario.id : null
            });
        } catch (error) {
            console.error("Error al obtener invitaciones:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async home(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const { filtro, page = 1 } = req.query;
        const { id: usuarioId, rol } = req.session.usuario;
        const clientesPorPagina = 5;

        try {
            const todosLosClientes = filtro 
                ? await clienteModel.obtenerClientesFiltrados(usuarioId, filtro)
                : await clienteModel.obtenerClientesPorUsuario(usuarioId);

            const clientes = todosLosClientes.slice((page - 1) * clientesPorPagina, page * clientesPorPagina);
            res.render("index", { 
                nombreUsuario: req.session.usuario.nombre,
                usuarioId: req.session.usuario.id,
                usuarioRol: rol,
                clientes, 
                filtro, 
                page: Number(page), 
                totalPaginas: Math.ceil(todosLosClientes.length / clientesPorPagina)
            });
        } catch (error) {
            console.error("Error en home:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async verInvitaciones(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        if (req.session.usuario.rol !== 'admin') {
            return res.status(403).send("Acceso denegado");
        }

        try {
            const usuariosPendientes = await usuarioModel.obtenerUsuariosPendientes();
            const usuariosRechazados = await usuarioModel.obtenerUsuariosRechazados();

            res.render("invitaciones", { 
                usuariosPendientes, 
                usuariosRechazados,
                nombreUsuario: req.session.usuario.nombre,
                usuarioRol: req.session.usuario.rol,
                usuarioId: req.session.usuario.id
            });
        } catch (error) {
            console.error("Error al obtener invitaciones:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async procesarInvitacion(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        const { accion } = req.body;
        await usuarioModel.actualizarPermiso(id, accion);
        res.redirect("/admin/invitaciones");
    }

    async rechazarUsuario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        try {
            await usuarioModel.actualizarPermiso(id, 'rechazado');
            res.redirect("/admin/invitaciones");
        } catch (error) {
            res.status(500).send("Error al rechazar");
        }
    }
    
    async guardarUsuario(req, res) {
        const { nombre, gmail, contraseña } = req.body;
    
        if (!nombre || !gmail || !contraseña) {
            return res.status(400).render("crearcuenta", { 
                error: "Todos los campos son obligatorios" 
            });
        }
    
        try {
            const usuarioExistente = await usuarioModel.validarUsuarioPorEmail(gmail);
            if (usuarioExistente) {
                return res.status(400).render("crearcuenta", { 
                    error: "El correo ya está en uso" 
                });
            }
    
            await usuarioModel.guardar({ nombre, gmail, contraseña });
            res.redirect("/login");
        } catch (error) {
            console.error("Error al guardar usuario:", error);
            return res.status(500).render("crearcuenta", { 
                error: "Error del servidor al guardar usuario." 
            });
        }
    }
    
    async loginUsuario(req, res) {  
        const { gmail, contraseña } = req.body;  

        if (!gmail || !contraseña) {  
            return res.status(400).render("login", { error: "Email y contraseña son obligatorios." });  
        }  

        try {  
            const usuario = await usuarioModel.validarUsuario(gmail, contraseña);  
            
            if (!usuario) {  
                return res.status(401).render("login", { error: "Credenciales incorrectas." });  
            }

            if (usuario.rol === 'usuario') {
                if (usuario.estado_permiso === 'pendiente') {
                    return res.status(403).render("login", { 
                        error: "Tu cuenta está pendiente de aprobación por el administrador." 
                    });
                }
                if (usuario.estado_permiso === 'rechazado') {
                    return res.status(403).render("login", { 
                        error: "Tu solicitud de acceso ha sido rechazada." 
                    });
                }
            }

            req.session.usuario = {   
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
                estado_permiso: usuario.estado_permiso
            };  

            res.redirect("/home");  
        } catch (error) {  
            console.error("Error al iniciar sesión:", error);  
            return res.status(500).render("login", { error: "Error del servidor." });  
        }  
    }

    async actualizarCliente(req, res) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: "No autorizado" });
        }
        const { id } = req.params;
        const { nombre, direccion, telefono } = req.body;
        const usuarioId = req.session.usuario.id;

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).json({ error: "Cliente no encontrado o no tiene permiso" });
            }

            await clienteModel.actualizarDatosBasicos(id, { nombre, direccion, telefono });
            res.json({ success: true });
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }
}

module.exports = UsuarioController;