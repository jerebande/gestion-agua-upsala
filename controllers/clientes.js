// controllers/clientes.js
const ClienteModel = require("../models/clientes"); 
const clienteModel = new ClienteModel();
const UsuarioModel = require("../models/usuarios"); // <-- NUEVO
const usuarioModel = new UsuarioModel();            // <-- NUEVO

class ClienteController {
    
    async actualizarBidones(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { id } = req.params;
        const { bidonesAdeudados } = req.body;
        const usuarioId = req.session.usuario.id;

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }
            await clienteModel.actualizarBidones(id, bidonesAdeudados);
            res.redirect(`/clientes/${id}`);
        } catch (error) {
            console.error("Error:", error);
            res.status(500).send("Error al actualizar envases");
        }
    }
    
    async listarCuentasPorFecha(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const fecha = req.query.fecha || new Date().toISOString().split("T")[0];
        const usuarioId = req.session.usuario.id;
        const usuarioRol = req.session.usuario.rol;

        try {
            const nombreUsuario = req.session.usuario.nombre;
            const cuentas = await clienteModel.obtenerCuentasPorFecha(fecha, usuarioId);

            const totalGeneral = cuentas.length > 0 ? parseFloat(cuentas[0].total_general) || 0 : 0;
            const totalPagados = cuentas.length > 0 ? parseFloat(cuentas[0].total_pagados) || 0 : 0;
            const totalFiados = cuentas.length > 0 ? parseFloat(cuentas[0].total_fiados) || 0 : 0;
            const totalTransferencias = cuentas.length > 0 ? parseFloat(cuentas[0].total_transferencias) || 0 : 0;

            const periodo7dias = await clienteModel.obtenerCuentasPorPeriodo('7dias', usuarioId);
            const periodo1mes = await clienteModel.obtenerCuentasPorPeriodo('1mes', usuarioId);
            const periodo6meses = await clienteModel.obtenerCuentasPorPeriodo('6meses', usuarioId);
            const periodo1anio = await clienteModel.obtenerCuentasPorPeriodo('1anio', usuarioId);

            res.render("historialCuentas", { 
                cuentas, fecha, nombreUsuario, usuarioRol, usuarioId,
                totalGeneral, totalPagados, totalFiados, totalTransferencias,
                periodo7dias, periodo1mes, periodo6meses, periodo1anio
            });
        } catch (error) {
            console.error("Error al obtener cuentas por fecha:", error);
            res.status(500).send("Error del servidor.");
        }
    }
    
    async eliminarCuenta(req, res) { 
        if (!req.session.usuario) return res.redirect("/login");
        const { idCliente, idCuenta } = req.params;
        const usuarioId = req.session.usuario.id;

        try {
            const cuenta = await clienteModel.obtenerCuentaPorId(idCuenta);
            if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
            const cliente = await clienteModel.obtenerClientePorId(cuenta.cliente_id, usuarioId);
            if (!cliente) return res.status(403).send("No tiene permiso para eliminar esta cuenta.");

            await clienteModel.eliminarCuenta(idCuenta);
            res.redirect(`/clientes/${idCliente}`);
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);
            res.status(500).send("Error del servidor al eliminar cuenta.");
        }
    }

    async eliminarCliente(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const clienteId = req.params.id;
        const usuarioId = req.session.usuario.id;

        try {
            const cliente = await clienteModel.obtenerClientePorId(clienteId, usuarioId);
            if (!cliente) return res.status(404).json({ error: "Cliente no encontrado o no tiene permiso." });
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
            await clienteModel.guardarCliente({  
                nombre, direccion, telefono, usuario_id: usuarioId,
            });  
            res.redirect("/home");  
        } catch (error) {  
            console.error("Error al guardar cliente:", error);
            res.status(500).send("Error al guardar cliente.");
        }  
    }

    async listarClientes(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const usuarioId = req.session.usuario.id;

        try {
            const clientes = await clienteModel.obtenerClientesPorUsuario(usuarioId);
            res.render("clientes", { clientes, usuario: req.session.usuario });
        } catch (error) {
            console.error("Error al obtener clientes:", error);
            res.status(500).render("clientes", {
                error: "Error del servidor al obtener clientes.",
                clientes: [],
                usuario: req.session.usuario,
            });
        }
    }

    async actualizarEstadoPago(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { idCliente, idCuenta } = req.params;
        const { estado_pago } = req.body;
        const usuarioId = req.session.usuario.id;

        if (estado_pago === undefined) {
            return res.status(400).send("El estado de pago es obligatorio.");
        }

        try {
            const cuenta = await clienteModel.obtenerCuentaPorId(idCuenta);
            if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
            const cliente = await clienteModel.obtenerClientePorId(cuenta.cliente_id, usuarioId);
            if (!cliente) return res.status(403).send("No tiene permiso para modificar esta cuenta.");

            await clienteModel.actualizarEstadoPago(idCuenta, estado_pago);
            res.redirect(`/clientes/${idCliente}`);
        } catch (error) {
            console.error("Error al actualizar estado de pago:", error);
            res.status(500).send("Error del servidor al actualizar estado de pago.");
        }
    }

    async registrarPagoParcial(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { idCliente, idCuenta } = req.params;
        const cantidad_pagada = parseInt(req.body.cantidad_pagada, 10);
        const usuarioId = req.session.usuario.id;

        if (!cantidad_pagada || cantidad_pagada <= 0) {
            return res.status(400).send('Cantidad pagada inválida');
        }

        try {
            const cuenta = await clienteModel.obtenerCuentaPorId(idCuenta);
            if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
            const cliente = await clienteModel.obtenerClientePorId(cuenta.cliente_id, usuarioId);
            if (!cliente) return res.status(403).send("No tiene permiso para modificar esta cuenta.");

            await clienteModel.registrarPagoParcial(idCuenta, cantidad_pagada);
            res.redirect(`/clientes/${idCliente}`);
        } catch (error) {
            console.error('Error al registrar pago parcial:', error);
            res.status(500).send('Error del servidor al registrar pago parcial.');
        }
    }

    async agregarCuenta(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { id } = req.params;
        const { estado_pago, cantidad_bidones } = req.body;
        const usuarioId = req.session.usuario.id;

        if (!estado_pago || !cantidad_bidones) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }

            // Obtener el precio del usuario actual
            const precio_bidon = await usuarioModel.obtenerPrecioUsuario(usuarioId); // <-- CAMBIADO

            await clienteModel.agregarCuenta({
                cliente_id: id,
                estado_pago,
                cantidad_bidones,
                precio_bidon
            });
            res.redirect(`/clientes/${id}`);
        } catch (error) {
            console.error("Error al agregar cuenta:", error);
            res.status(500).send("Error del servidor al agregar cuenta.");
        }
    }

    async obtenerClientePorId(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { id } = req.params;
        const pagina = parseInt(req.query.pagina) || 1;
        const usuarioId = req.session.usuario.id;

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }

            const cuentasData = await clienteModel.obtenerCuentasPorCliente(id, pagina);
            // Obtener el precio del usuario actual
            const precioActual = await usuarioModel.obtenerPrecioUsuario(usuarioId); // <-- CAMBIADO

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
            res.status(500).send("Error del servidor al obtener cliente.");
        }
    }

    async actualizarCliente(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { id } = req.params;
        const { estado_pago, cantidad_bidones, precio_bidon } = req.body;
        const usuarioId = req.session.usuario.id;

        if (estado_pago === undefined || !cantidad_bidones || !precio_bidon) {
            return res.status(400).send("Todos los campos son obligatorios");
        }

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }

            const total = cantidad_bidones * precio_bidon;
            await clienteModel.actualizarCliente(id, { estado_pago, cantidad_bidones, precio_bidon, total });
            res.redirect(`/clientes/${id}`);
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            res.status(500).send("Error del servidor al actualizar cliente.");
        }
    }

    async actualizarDatosBasicos(req, res) {
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
            console.error("Error al actualizar datos básicos del cliente:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }
}

module.exports = ClienteController;