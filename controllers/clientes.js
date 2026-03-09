const ClienteModel = require("../models/clientes"); 
const clienteModel = new ClienteModel();
const ConfiguracionModel = require("../models/configuracion");
const configuracionModel = new ConfiguracionModel();

class ClienteController {
    
async actualizarBidones(req, res) {
    const { id } = req.params;
    const { bidonesAdeudados } = req.body; // Este valor viene del input numérico

    try {
        await clienteModel.actualizarBidones(id, bidonesAdeudados);
        res.redirect(`/clientes/${id}`); // Redirige al detalle del cliente para ver el cambio
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error al actualizar envases");
    }
}
    
async listarCuentasPorFecha(req, res) {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }

    const fecha = req.query.fecha || new Date().toISOString().split("T")[0];

    try {
        const nombreUsuario = req.session.usuario.nombre;
        const usuarioRol = req.session.usuario.rol;
        const usuarioId = req.session.usuario.id; // <-- AGREGADO
        const cuentas = await clienteModel.obtenerCuentasPorFecha(fecha);

        // Extraer totales del primer resultado (si existe)
        const totalGeneral = cuentas.length > 0 ? cuentas[0].total_general : 0;
        const totalPagados = cuentas.length > 0 ? cuentas[0].total_pagados : 0;
        const totalFiados = cuentas.length > 0 ? cuentas[0].total_fiados : 0;
        const totalTransferencias = cuentas.length > 0 ? cuentas[0].total_transferencias : 0;

        // Obtener datos por períodos
        const periodo7dias = await clienteModel.obtenerCuentasPorPeriodo('7dias');
        const periodo1mes = await clienteModel.obtenerCuentasPorPeriodo('1mes');
        const periodo6meses = await clienteModel.obtenerCuentasPorPeriodo('6meses');
        const periodo1anio = await clienteModel.obtenerCuentasPorPeriodo('1anio');

        res.render("historialCuentas", { 
            cuentas, 
            fecha, 
            nombreUsuario, 
            usuarioRol,
            usuarioId, // <-- AGREGADO
            totalGeneral, 
            totalPagados, 
            totalFiados, 
            totalTransferencias,
            periodo7dias,
            periodo1mes,
            periodo6meses,
            periodo1anio
        });
    } catch (error) {
        console.error("Error al obtener cuentas por fecha:", error);
        return res.status(500).send("Error del servidor.");
    }
}
    
async eliminarCuenta(req, res) { 
    const { idCliente, idCuenta } = req.params; 
    try { 
        await clienteModel.eliminarCuenta(idCuenta); 
        res.redirect(`/clientes/${idCliente}`); 
    } catch (error) { 
        console.error("Error al eliminar cuenta:", error); 
        return res.status(500).send("Error del servidor al eliminar cuenta."); 
    } 
}

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

async registrarPagoParcial(req, res) {
    const { idCliente, idCuenta } = req.params;
    const cantidad_pagada = parseInt(req.body.cantidad_pagada, 10);

    if (!cantidad_pagada || cantidad_pagada <= 0) {
        return res.status(400).send('Cantidad pagada inválida');
    }

    try {
        await clienteModel.registrarPagoParcial(idCuenta, cantidad_pagada);
        res.redirect(`/clientes/${idCliente}`);
    } catch (error) {
        console.error('Error al registrar pago parcial:', error);
        return res.status(500).send('Error del servidor al registrar pago parcial.');
    }
}

async agregarCuenta(req, res) {
    const { id } = req.params; // ID del cliente
    const { estado_pago, cantidad_bidones } = req.body;

    if (!estado_pago || !cantidad_bidones) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    try {
        // Obtener precio actual de configuración
        const precio_bidon = await configuracionModel.obtenerPrecioBidon();
        
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
    const pagina = parseInt(req.query.pagina) || 1;

    try {
        const cliente = await clienteModel.obtenerClientePorId(id);
        const cuentasData = await clienteModel.obtenerCuentasPorCliente(id, pagina);
        const precioActual = await configuracionModel.obtenerPrecioBidon();

        if (!cliente) {
            return res.status(404).send("Cliente no encontrado.");
        }

        res.render("detalleCliente", { 
            cliente, 
            cuentas: cuentasData.cuentas,
            paginaActual: cuentasData.paginaActual,
            totalCuentas: cuentasData.totalCuentas,
            totalPaginas: cuentasData.totalPaginas,
            precioActual 
        });
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

// ----- NUEVO MÉTODO PARA ACTUALIZAR DATOS BÁSICOS (nombre, dirección, teléfono) -----
async actualizarDatosBasicos(req, res) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "No autorizado" });
    }
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;
    const usuarioId = req.session.usuario.id;
    const rol = req.session.usuario.rol;

    try {
        let cliente;
        if (rol === 'admin') {
            cliente = await clienteModel.obtenerClientePorId(id);
        } else {
            cliente = await clienteModel.obtenerClientePorIdYUsuario(id, usuarioId);
        }
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado o no tiene permiso" });
        }

        await clienteModel.actualizarDatosBasicos(id, { nombre, direccion, telefono });
        res.json({ success: true });
    } catch (error) {
        console.error("Error al actualizar datos básicos del cliente:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
    
}

module.exports = ClienteController;