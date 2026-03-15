const ClienteModel = require("../models/clientes"); 
const clienteModel = new ClienteModel();
const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const pool = require("../database/db"); // Necesario para eliminarEstadoSemanal

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
    
    // 📌 MODIFICADO: calcula totales a partir de las cuentas obtenidas
    async listarCuentasPorFecha(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const fecha = req.query.fecha || new Date().toISOString().split("T")[0];
        const usuarioId = req.session.usuario.id;
        const usuarioRol = req.session.usuario.rol;

        try {
            const nombreUsuario = req.session.usuario.nombre;
            const cuentas = await clienteModel.obtenerCuentasPorFecha(fecha, usuarioId);

            // Calcular totales a partir de las cuentas (filtradas por usuario)
            let totalGeneral = 0, totalPagados = 0, totalFiados = 0, totalTransferencias = 0;
            cuentas.forEach(c => {
                const total = parseFloat(c.total) || 0;
                totalGeneral += total;
                if (c.estado_pago == 1) totalPagados += total;
                else if (c.estado_pago == 0) totalFiados += total;
                else if (c.estado_pago == 2) totalTransferencias += total;
            });

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
        const { nombre, direccion, telefono, dia_reparto } = req.body;

        if (req.session.usuario.rol === 'gabriel' && !dia_reparto) {
            return res.status(400).send("El día de reparto es obligatorio para usuarios gabriel.");
        }

        try {  
            await clienteModel.guardarCliente({  
                nombre, 
                direccion, 
                telefono, 
                usuario_id: usuarioId,
                dia_reparto: dia_reparto || null
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
        const monto_pagado = parseFloat(req.body.monto_pagado);
        const usuarioId = req.session.usuario.id;

        if (!monto_pagado || monto_pagado <= 0) {
            return res.status(400).send('Monto pagado inválido');
        }

        try {
            const cuenta = await clienteModel.obtenerCuentaPorId(idCuenta);
            if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
            const cliente = await clienteModel.obtenerClientePorId(cuenta.cliente_id, usuarioId);
            if (!cliente) return res.status(403).send("No tiene permiso para modificar esta cuenta.");

            await clienteModel.registrarPagoParcial(idCuenta, monto_pagado);
            res.redirect(`/clientes/${idCliente}`);
        } catch (error) {
            console.error('Error al registrar pago parcial:', error);
            res.status(500).send('Error del servidor al registrar pago parcial.');
        }
    }

    async agregarCuenta(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        const { id } = req.params;
        const { estado_pago, cantidad_bidones, monto } = req.body;
        const usuarioId = req.session.usuario.id;
        const usuarioRol = req.session.usuario.rol;

        if (!estado_pago) {
            return res.status(400).send("El estado de pago es obligatorio.");
        }

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }

            if (usuarioRol === 'gabriel') {
                if (monto && monto.trim() !== '') {
                    const montoVal = parseFloat(monto);
                    if (isNaN(montoVal) || montoVal <= 0) {
                        return res.status(400).send("Monto inválido.");
                    }
                    await clienteModel.agregarCuenta({
                        cliente_id: id,
                        estado_pago,
                        cantidad_bidones: montoVal,
                        precio_bidon: 1,
                        total: montoVal
                    });
                } else if (cantidad_bidones && cantidad_bidones.trim() !== '') {
                    const cant = parseFloat(cantidad_bidones);
                    if (isNaN(cant) || cant <= 0) {
                        return res.status(400).send("Cantidad inválida.");
                    }
                    const precio_bidon = await usuarioModel.obtenerPrecioUsuario(usuarioId);
                    const total = cant * precio_bidon;
                    await clienteModel.agregarCuenta({
                        cliente_id: id,
                        estado_pago,
                        cantidad_bidones: cant,
                        precio_bidon,
                        total
                    });
                } else {
                    return res.status(400).send("Debe ingresar un monto o una cantidad.");
                }
            } else {
                if (!cantidad_bidones) {
                    return res.status(400).send("La cantidad de bidones es obligatoria.");
                }
                const cant = parseFloat(cantidad_bidones);
                if (isNaN(cant) || cant <= 0) {
                    return res.status(400).send("Cantidad inválida.");
                }
                const precio_bidon = await usuarioModel.obtenerPrecioUsuario(usuarioId);
                const total = cant * precio_bidon;
                await clienteModel.agregarCuenta({
                    cliente_id: id,
                    estado_pago,
                    cantidad_bidones: cant,
                    precio_bidon,
                    total
                });
            }
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
        const dia = req.query.dia || null;
        const usuarioId = req.session.usuario.id;
        const usuarioRol = req.session.usuario.rol;

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) {
                return res.status(404).send("Cliente no encontrado o no tiene permiso.");
            }

            const cuentasData = await clienteModel.obtenerCuentasPorCliente(id, pagina);
            const precioActual = await usuarioModel.obtenerPrecioUsuario(usuarioId);
            
            let historialSemanal = [];
            if (usuarioRol === 'gabriel') {
                historialSemanal = await clienteModel.obtenerEstadosSemanalesPorCliente(id);
            }

            const historialFormateado = historialSemanal.map(item => {
                let fechaStr = '';
                try {
                    const fecha = new Date(item.semana);
                    if (!isNaN(fecha.getTime())) {
                        const opciones = { weekday: 'long', day: '2-digit', month: '2-digit' };
                        fechaStr = fecha.toLocaleDateString('es-AR', opciones);
                        fechaStr = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
                    } else {
                        fechaStr = 'Fecha inválida';
                    }
                } catch (e) {
                    fechaStr = 'Fecha inválida';
                }
                return {
                    id: item.id,
                    estado: item.estado,
                    semanaFormateada: fechaStr
                };
            });

            res.render("detalleCliente", { 
                cliente, 
                cuentas: cuentasData.cuentas,
                paginaActual: cuentasData.paginaActual,
                totalCuentas: cuentasData.totalCuentas,
                totalPaginas: cuentasData.totalPaginas,
                precioActual,
                historialSemanal: historialFormateado,
                usuarioRol,
                usuarioId,
                dia
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

    // ----- MÉTODOS PARA ESTADOS SEMANALES (solo accesibles por rol 'gabriel') -----
    async guardarEstadoSemanal(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        if (req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        const { id } = req.params;
        const { estado } = req.body;
        const usuarioId = req.session.usuario.id;

        if (!estado) return res.status(400).json({ error: "Estado requerido" });

        try {
            const cliente = await clienteModel.obtenerClientePorId(id, usuarioId);
            if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

            const fechaHoy = new Date();
            const diaSemana = fechaHoy.getDay();
            const diff = diaSemana === 0 ? 6 : diaSemana - 1;
            const monday = new Date(fechaHoy);
            monday.setDate(fechaHoy.getDate() - diff);
            const semanaStr = monday.toISOString().split('T')[0];

            await clienteModel.guardarEstadoSemanal(id, semanaStr, estado);
            res.json({ success: true, estado });
        } catch (error) {
            console.error("Error al guardar estado semanal:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async eliminarEstadoSemanal(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        if (req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        const { id } = req.params;
        const usuarioId = req.session.usuario.id;

        try {
            const sql = `
                SELECT ces.* FROM clientes_estados_semanales ces
                JOIN clientes c ON ces.cliente_id = c.id
                WHERE ces.id = ? AND c.usuario_id = ?
            `;
            const [rows] = await pool.query(sql, [id, usuarioId]);
            if (rows.length === 0) return res.status(404).json({ error: "No encontrado o sin permiso" });

            await clienteModel.eliminarEstadoSemanal(id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error al eliminar estado semanal:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }
}

module.exports = ClienteController;