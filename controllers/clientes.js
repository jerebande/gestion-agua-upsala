const ClienteModel = require("../models/clientes"); 
const clienteModel = new ClienteModel();

class ClienteController {
    async actualizarBidones(req, res) {
        const { id } = req.params; // ID del cliente
        const { bidonesAdeudados } = req.body;
    
        if (!bidonesAdeudados || isNaN(bidonesAdeudados)) {
            return res.status(400).send("La cantidad de bidones es obligatoria y debe ser un número válido.");
        }
    
        try {
            await clienteModel.actualizarBidones(id, bidonesAdeudados);
            res.redirect(`/home`);
        } catch (error) {
            console.error("Error al actualizar bidones adeudados:", error);
            return res.status(500).send("Error del servidor al actualizar los bidones.");
        }
    }
    
        async listarCuentasPorFecha(req, res) {
            if (!req.session.usuario) {
                return res.redirect("/login");
            }
        
            const fecha = req.query.fecha || new Date().toISOString().split("T")[0]; // Fecha actual si no se proporciona
        
            try {
                const nombreUsuario = req.session.usuario.nombre;
                const cuentas = await clienteModel.obtenerCuentasPorFecha(fecha);
        
                // Extraer los totales de los resultados
                const totalGeneral = cuentas.length > 0 ? cuentas[0].total_general : 0;
                const totalPagados = cuentas.length > 0 ? cuentas[0].total_pagados : 0;
                const totalFiados = cuentas.length > 0 ? cuentas[0].total_fiados : 0;
                const totalTransferencias = cuentas.length > 0 ? cuentas[0].total_transferencias : 0;
        
                res.render("historialCuentas", {
                    cuentas,
                    nombreUsuario,
                    fecha,
                    totalGeneral,
                    totalPagados,
                    totalFiados,
                    totalTransferencias,
                    usuario: req.session.usuario,
                });
            } catch (error) {
                console.error("Error al obtener cuentas por fecha:", error);
                return res.status(500).send("Error del servidor al obtener cuentas.");
            }
        }
    
     
    
    async eliminarCuenta(req, res) { const { idCliente, idCuenta } = req.params; try { await clienteModel.eliminarCuenta(idCuenta); res.redirect(`/clientes/${idCliente}`); } catch (error) { console.error("Error al eliminar cuenta:", error); return res.status(500).send("Error del servidor al eliminar cuenta."); } }
    
    
        async eliminarCliente(req, res) {
            if (!req.session.usuario) {
                return res.redirect("/login");
            }
    
            const clienteId = req.params.id;
    
            try {
                await clienteModel.eliminarCliente(clienteId);
                res.sendStatus(200);
            } catch (error) {
                console.error("Error al eliminar cliente:", error);
                res.sendStatus(500);
            }
        }
    
        // Resto de métodos...
    
    
        async guardarCliente(req, res) {  
        if (!req.session.usuario) return res.redirect("/login");
      
        const usuarioId = req.session.usuario.id;
        const { nombre, direccion, telefono } = req.body;
      
        try {  
            // Se asocia el cliente al ID del usuario que lo crea
            await clienteModel.guardarCliente({  
                nombre,  
                direccion,  
                telefono,  
                usuario_id: usuarioId,
            });  
            res.redirect("/home");  
        } catch (error) {  
            res.status(500).send("Error al guardar cliente.");
        }  
    }
  
        async listarClientes(req, res) {
            if (!req.session.usuario) {
                return res.redirect("/login");
            }
        
            try {
                const clientes = await clienteModel.obtenerClientesPorUsuario(req.session.usuario.id);
                res.render("clientes", { clientes, usuario: req.session.usuario });
            } catch (error) {
                console.error("Error al obtener clientes:", error);
                return res.status(500).render("clientes", {
                    error: "Error del servidor al obtener clientes.",
                    clientes: [],
                    usuario: req.session.usuario,
                });
            }
        }
        
    
    
    async actualizarEstadoPago(req, res) {
        const { idCliente, idCuenta } = req.params;
        const { estado_pago } = req.body;
    
        if (estado_pago === undefined) {
            return res.status(400).send("El estado de pago es obligatorio.");
        }
    
        try {
            await clienteModel.actualizarEstadoPago(idCuenta, estado_pago);
            res.redirect(`/clientes/${idCliente}`);
        } catch (error) {
            console.error("Error al actualizar estado de pago:", error);
            return res.status(500).send("Error del servidor al actualizar estado de pago.");
        }
    }
    
     
   
    
    
     
    
    
    async agregarCuenta(req, res) {
        const { id } = req.params; // ID del cliente
        const { estado_pago, cantidad_bidones, precio_bidon } = req.body;

        if (!estado_pago || !cantidad_bidones || !precio_bidon) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        try {
            await clienteModel.agregarCuenta({
                cliente_id: id,
                estado_pago,
                cantidad_bidones,
                precio_bidon
            });
            res.redirect(`/clientes/${id}`);
        } catch (error) {
            console.error("Error al agregar cuenta:", error);
            return res.status(500).send("Error del servidor al agregar cuenta.");
        }
    }

    async obtenerClientePorId(req, res) {
        const { id } = req.params;

        try {
            const cliente = await clienteModel.obtenerClientePorId(id);
            const cuentas = await clienteModel.obtenerCuentasPorCliente(id);

            if (!cliente) {
                return res.status(404).send("Cliente no encontrado.");
            }

            res.render("detalleCliente", { cliente, cuentas });
        } catch (error) {
            console.error("Error al obtener cliente:", error);
            return res.status(500).send("Error del servidor al obtener cliente.");
        }
    }

    async actualizarCliente(req, res) {
        const { id } = req.params;
        const { estado_pago, cantidad_bidones, precio_bidon } = req.body;
    
        if (estado_pago === undefined || !cantidad_bidones || !precio_bidon) {
            return res.status(400).send("Todos los campos son obligatorios");
        }
    
        try {
            const total = cantidad_bidones * precio_bidon;
            await clienteModel.actualizarCliente(id, { estado_pago, cantidad_bidones, precio_bidon, total });
            res.redirect(`/clientes/${id}`);
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            return res.status(500).send("Error del servidor al actualizar cliente.");
        }
    }
    
   
    
}

module.exports = ClienteController;
