const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const ClienteModel = require("../models/clientes");
const clienteModel = new ClienteModel();
const ConfiguracionModel = require("../models/configuracion");
const configuracionModel = new ConfiguracionModel();
const { obtenerFechaLocal, obtenerLunesSemanaActual } = require("../utils/fecha");

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
                                                                         
        const { filtro, page = 1, dia } = req.query;
        const { id: usuarioId, rol } = req.session.usuario;
        const clientesPorPagina = 20;
        const precioActual = await usuarioModel.obtenerPrecioUsuario(usuarioId);

        try {
            let todosLosClientes;
            let diaSeleccionado = null;

            if (rol === 'gabriel') {
                diaSeleccionado = dia || 'lunes';
                todosLosClientes = await clienteModel.obtenerClientesFiltrados(usuarioId, filtro, diaSeleccionado);
                const fechaHoy = obtenerFechaLocal();
                for (let cliente of todosLosClientes) {
                    cliente.totalFiadoHoy = await clienteModel.obtenerTotalFiadoPorClienteYFecha(cliente.id, fechaHoy);
                    cliente.totalFiadoGeneral = await clienteModel.obtenerTotalFiadoGeneral(cliente.id);
                }
            } else {
                todosLosClientes = filtro 
                    ? await clienteModel.obtenerClientesFiltrados(usuarioId, filtro)
                    : await clienteModel.obtenerClientesPorUsuario(usuarioId);
                for (let cliente of todosLosClientes) {
                    cliente.totalFiadoGeneral = await clienteModel.obtenerTotalFiadoGeneral(cliente.id);
                }
            }

            let estadosSemanales = {};
            if (rol === 'gabriel') {
                const semanaStr = obtenerLunesSemanaActual();
                estadosSemanales = await clienteModel.obtenerEstadosSemanalesPorUsuarioYSemana(usuarioId, semanaStr);
            }

            const fechaHoy = obtenerFechaLocal();
            const entregasHoyIds = await clienteModel.obtenerEntregasHoy(usuarioId, fechaHoy);

            todosLosClientes = todosLosClientes.map(cliente => ({
                ...cliente,
                entrega_hoy: entregasHoyIds.includes(cliente.id)
            }));

            todosLosClientes.sort((a, b) => {
                if (a.entrega_hoy === b.entrega_hoy) {
                    return (a.nombre || '').localeCompare(b.nombre || '');
                }
                return b.entrega_hoy ? 1 : -1;
            });

            let clientes;
            let totalPaginas = 1;

            if (rol === 'gabriel') {
                clientes = todosLosClientes;
            } else {
                clientes = todosLosClientes.slice((page - 1) * clientesPorPagina, page * clientesPorPagina);
                totalPaginas = Math.ceil(todosLosClientes.length / clientesPorPagina);
            }

            const flash = req.session.flash || null;
            req.session.flash = null;

            res.render("index", { 
                nombreUsuario: req.session.usuario.nombre,
                usuarioId,
                usuarioRol: rol,
                clientes, 
                filtro, 
                page: Number(page), 
                totalPaginas,
                diaSeleccionado,
                estadosSemanales,
                precioActual,
                flash
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
            const flash = req.session.flash || null;
            req.session.flash = null;

            res.render("invitaciones", { 
                usuariosPendientes, 
                usuariosRechazados,
                nombreUsuario: req.session.usuario.nombre,
                usuarioRol: req.session.usuario.rol,
                usuarioId: req.session.usuario.id,
                flash
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
        req.session.flash = { 
            tipo: 'success', 
            mensaje: accion === 'aceptado' ? 'Usuario aceptado correctamente.' : 'Usuario rechazado.' 
        };
        res.redirect("/admin/invitaciones");
    }

    async rechazarUsuario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        try {
            await usuarioModel.actualizarPermiso(id, 'rechazado');
            req.session.flash = { tipo: 'success', mensaje: 'Usuario rechazado correctamente.' };
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
            const precioDefecto = await configuracionModel.obtenerPrecioBidon();
            await usuarioModel.guardar({ nombre, gmail, contraseña }, precioDefecto);
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

            // Bloqueo
            if (usuario.estado_permiso === 'bloqueado') {
                return res.status(403).render("login", { 
                    error: "Tu cuenta ha sido bloqueada. Contactá al administrador." 
                });
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

    // =============================================
    // GESTIÓN DE USUARIOS (NUEVO)
    // =============================================

    async mostrarGestionUsuarios(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        try {
            const todosLosUsuarios = await usuarioModel.obtenerTodosLosUsuarios();
            const stats = await usuarioModel.obtenerEstadisticas();
            const usuariosPendientes = await usuarioModel.obtenerUsuariosPendientes();
            const usuariosBloqueadosList = todosLosUsuarios.filter(u => u.estado_permiso === 'bloqueado');

            const flash = req.session.flash || null;
            req.session.flash = null;

            res.render("gestionar-usuarios", {
                todosLosUsuarios,
                usuariosPendientes,
                usuariosBloqueadosList,
                totalUsuarios: parseInt(stats.total) || 0,
                usuariosActivos: parseInt(stats.activos) || 0,
                usuariosBloqueados: parseInt(stats.bloqueados) || 0,
                nombreUsuario: req.session.usuario.nombre,
                usuarioRol: req.session.usuario.rol,
                usuarioId: req.session.usuario.id,
                flash
            });
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            res.status(500).send("Error del servidor");
        }
    }

    async bloquearUsuario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        if (parseInt(id) === req.session.usuario.id) {
            req.session.flash = { tipo: 'error', mensaje: 'No podés bloquearte a vos mismo.' };
            return res.redirect("/admin/usuarios");
        }
        try {
            await usuarioModel.bloquearUsuario(id);
            req.session.flash = { tipo: 'success', mensaje: 'Usuario bloqueado correctamente.' };
        } catch (error) {
            console.error("Error al bloquear usuario:", error);
            req.session.flash = { tipo: 'error', mensaje: 'Error al bloquear usuario.' };
        }
        res.redirect("/admin/usuarios");
    }

    async desbloquearUsuario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        try {
            await usuarioModel.desbloquearUsuario(id);
            req.session.flash = { tipo: 'success', mensaje: 'Usuario desbloqueado. Ya puede iniciar sesión.' };
        } catch (error) {
            console.error("Error al desbloquear usuario:", error);
            req.session.flash = { tipo: 'error', mensaje: 'Error al desbloquear usuario.' };
        }
        res.redirect("/admin/usuarios");
    }

    async eliminarUsuario(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
            return res.redirect("/login");
        }
        const { id } = req.params;
        if (parseInt(id) === req.session.usuario.id) {
            req.session.flash = { tipo: 'error', mensaje: 'No podés eliminar tu propia cuenta.' };
            return res.redirect("/admin/usuarios");
        }
        try {
            const result = await usuarioModel.eliminarUsuario(id);
            if (result.affectedRows === 0) {
                req.session.flash = { tipo: 'warning', mensaje: 'No se encontró el usuario o es administrador.' };
            } else {
                req.session.flash = { tipo: 'success', mensaje: 'Usuario eliminado permanentemente.' };
            }
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            req.session.flash = { tipo: 'error', mensaje: 'Error al eliminar usuario.' };
        }
        res.redirect("/admin/usuarios");
    }
}

module.exports = UsuarioController;
