const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const ClienteModel = require("../models/clientes");
const clienteModel = new ClienteModel();

class UsuarioController {
   async home(req, res) {
    if (!req.session.usuario) return res.redirect("/login");

    const { filtro, page = 1 } = req.query;
    const { id: usuarioId, rol } = req.session.usuario;
    const clientesPorPagina = 5;

    try {
        let todosLosClientes;
        // El administrador ve todos los clientes; el usuario solo los suyos
        if (rol === 'admin') {
            todosLosClientes = filtro 
                ? await clienteModel.obtenerTodosLosClientesFiltrados(filtro)
                : await clienteModel.obtenerTodosLosClientesGlobal();
        } else {
            todosLosClientes = filtro 
                ? await clienteModel.obtenerClientesFiltrados(usuarioId, filtro)
                : await clienteModel.obtenerClientesPorUsuario(usuarioId);
        }

        const clientes = todosLosClientes.slice((page - 1) * clientesPorPagina, page * clientesPorPagina);
        res.render("index", { 
            nombreUsuario: req.session.usuario.nombre,
            usuarioRol: rol,
            clientes, 
            filtro, 
            page: Number(page), 
            totalPaginas: Math.ceil(todosLosClientes.length / clientesPorPagina)
        });
    } catch (error) {
        res.status(500).send("Error del servidor");
    }
}
async verInvitaciones(req, res) {
    if (req.session.usuario?.rol !== 'admin') return res.redirect("/home");
    const usuariosPendientes = await usuarioModel.obtenerUsuariosPendientes();
    res.render("invitaciones", { usuariosPendientes });
}
async procesarInvitacion(req, res) {
    const { id } = req.params;
    const { accion } = req.body;
    await usuarioModel.actualizarPermiso(id, accion);
    res.redirect("/admin/invitaciones");
}
    
    async guardarUsuario(req, res) {
        const { nombre, gmail, contraseña } = req.body;
    
        // Validar que todos los campos estén presentes
        if (!nombre || !gmail || !contraseña) {
            return res.status(400).render("crearcuenta", { 
                error: "Todos los campos son obligatorios" 
            });
        }
    
        try {
            // Verificar si el correo ya existe
            const usuarioExistente = await usuarioModel.validarUsuarioPorEmail(gmail);
            if (usuarioExistente) {
                return res.status(400).render("crearcuenta", { 
                    error: "El correo ya está en uso" 
                });
            }
    
            // Guardar usuario
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
    
        // Validar que los campos no estén vacíos  
        if (!gmail || !contraseña) {  
            return res.status(400).render("login", {   
                error: "Email y contraseña son obligatorios."   
            });  
        }  
    
        try {  
            // Validar credenciales  
            const usuario = await usuarioModel.validarUsuario(gmail, contraseña);  
            if (!usuario) {  
                return res.status(401).render("login", {   
                    error: "Credenciales incorrectas."   
                });  
            }  
    
            // Crear sesión, asegurándote de incluir el id  
            req.session.usuario = {   
                id: usuario.id, // Asegúrate de incluir el id  
                nombre: usuario.nombre,
                rol: usuario.rol, // Guardar rol en sesión
                estado_permiso: usuario.estado_permiso // Guardar estado de permiso   
            };  
            console.log("Sesión creada:", req.session.usuario);  
    
            res.redirect("/home");  
        } catch (error) {  
            console.error("Error al iniciar sesión:", error);  
            return res.status(500).render("login", {   
                error: "Error del servidor al iniciar sesión."   
            });  
        }  
    }
    
}

module.exports = UsuarioController;
