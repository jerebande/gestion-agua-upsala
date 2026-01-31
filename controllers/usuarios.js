const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const ClienteModel = require("../models/clientes");
const clienteModel = new ClienteModel();

class UsuarioController {
    async home(req, res) {
        if (!req.session.usuario) {
            return res.redirect("/login");
        }

        const { filtro, page = 1 } = req.query; // Captura el filtro de búsqueda y la página actual
        const usuarioId = req.session.usuario.id;
        const clientesPorPagina = 5; // Número de clientes por página

        try {
            // Obtiene todos los clientes, filtrados si filtro no está vacío
            const todosLosClientes = filtro 
                ? await clienteModel.obtenerClientesFiltrados(usuarioId, filtro)
                : await clienteModel.obtenerClientesPorUsuario(usuarioId);

            // Calcula el número total de páginas
            const totalClientes = todosLosClientes.length;
            const totalPaginas = Math.ceil(totalClientes / clientesPorPagina);

            // Obtiene los clientes para la página actual
            const clientes = todosLosClientes.slice((page - 1) * clientesPorPagina, page * clientesPorPagina);

            const nombreUsuario = req.session.usuario.nombre;

            res.render("index", { nombreUsuario, clientes, filtro, page: Number(page), totalPaginas });
        } catch (error) {
            console.error("Error al obtener clientes:", error);
            res.status(500).send("Error del servidor al cargar la página principal.");
        }
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
                nombre: usuario.nombre   
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
