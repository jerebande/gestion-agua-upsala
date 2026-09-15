// controllers/asistenteController.js
const ClienteModel = require("../models/clientes");
const clienteModel = new ClienteModel();
const UsuarioModel = require("../models/usuarios");
const usuarioModel = new UsuarioModel();
const StockGastosModel = require("../models/stockGastos");
const stockGastosModel = new StockGastosModel();
const { interpretarMensaje, transcribirAudio } = require("../services/asistenteNLU");
const { obtenerFechaLocal } = require("../utils/fecha");

function estadoVacio() {
    return { intent: null, paso: null, datos: {} };
}

function formatearMoneda(n) {
    return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFecha(f) {
    try { return new Date(f).toLocaleDateString('es-AR'); } catch (e) { return ''; }
}

class AsistenteController {

    // ── Vista del chat (opcional, por si se accede directo a /asistente) ────
    async mostrarAsistente(req, res) {
        if (!req.session.usuario) return res.redirect("/login");
        res.render("asistente", {
            nombreUsuario: req.session.usuario.nombre,
            usuarioRol: req.session.usuario.rol,
            usuarioId: req.session.usuario.id
        });
    }

    // ── Endpoint principal (texto) ───────────────────────────────────────────
    async procesarMensaje(req, res) {
        if (!req.session.usuario) return res.status(401).json({ error: "No autorizado" });

        const texto = (req.body.mensaje || "").toString().trim();
        if (!texto) return res.json({ respuesta: "Escribime algo para poder ayudarte 🙂" });

        const respuesta = await this.procesarTexto(texto, req);
        return res.json({ respuesta });
    }

    // ── Endpoint de audio: transcribe con Whisper (Groq) y sigue el mismo flujo ──
    async procesarAudio(req, res) {
        if (!req.session.usuario) return res.status(401).json({ error: "No autorizado" });
        if (!req.file) return res.status(400).json({ error: "No se recibió ningún audio" });

        let texto;
        try {
            texto = await transcribirAudio(req.file.buffer, req.file.mimetype);
        } catch (error) {
            console.error("Error transcribiendo audio con Groq:", error.message);
            return res.json({
                respuesta: "No pude transcribir el audio. Probá de nuevo o escribí el mensaje.",
                transcripcion: null
            });
        }

        if (!texto) {
            return res.json({ respuesta: "No detecté ninguna voz en el audio. Probá de nuevo.", transcripcion: "" });
        }

        const respuesta = await this.procesarTexto(texto, req);
        return res.json({ respuesta, transcripcion: texto });
    }

    // ── Lógica común: interpreta el texto (venga de teclado o de audio) y avanza la conversación ──
    async procesarTexto(texto, req) {
        if (!req.session.asistente) req.session.asistente = estadoVacio();
        const estado = req.session.asistente;

        // Atajo rápido y gratis, sin llamar a la IA, para cancelar
        if (/^(cancelar|salir|volver|olvidalo|dejalo)$/i.test(texto)) {
            req.session.asistente = estadoVacio();
            return "Listo, cancelé la operación. ¿En qué más te ayudo?";
        }

        let extraido;
        try {
            extraido = await interpretarMensaje(texto, estado, req.session.usuario.rol);
        } catch (error) {
            console.error("Error interpretando mensaje con Groq:", error.message);
            return "No pude entender el mensaje porque hubo un problema para conectarme con el motor de lenguaje. Probá de nuevo en un momento.";
        }

        if (extraido.cancelar) {
            req.session.asistente = estadoVacio();
            return "Listo, cancelé la operación. ¿En qué más te ayudo?";
        }

        try {
            let respuesta;

            if (!estado.intent) {
                if (!extraido.intent || extraido.intent === 'otro') {
                    respuesta = this.mensajeAyuda(req.session.usuario.rol);
                } else {
                    estado.intent = extraido.intent;
                    estado.datos = {};
                    this.mergearDatos(estado, extraido);
                    respuesta = await this.avanzar(req);
                }
            } else {
                this.mergearDatos(estado, extraido);
                respuesta = await this.avanzar(req);
            }

            return respuesta;
        } catch (error) {
            console.error("Error en WalterBot:", error);
            req.session.asistente = estadoVacio();
            return "Uy, hubo un error del servidor. Probá de nuevo.";
        }
    }

    mensajeAyuda(rol) {
        let msg = "Soy WalterBot 🤖. Puedo ayudarte a:\n" +
            "• Crear un cliente nuevo (ej: \"creá un cliente que se llama Juan Pérez, vive en Av Siempre Viva 742, el tel es 1122334455, reparto los lunes\")\n" +
            "• Registrar una entrega (ej: \"a Juan Pérez llevale 3 bidones, quedó fiado\")\n" +
            "• Saldar un fiado (ej: \"cobrale el fiado a Juan, pagó todo en efectivo\")\n" +
            "• Cambiar el precio del bidón (ej: \"el bidón ahora sale 2500\")";
        if (rol === 'gabriel') {
            msg += "\n• Consultar tus gastos (ej: \"decime los gastos del miércoles 9 de septiembre\", \"los gastos entre el martes y el jueves\", \"cuánto gasté en los últimos 3 días\")";
            msg += "\n• Registrar un gasto nuevo (ej: \"gasté 5000 en nafta\", \"anotá un gasto de mantenimiento de la moto por 12000\")";
        }
        msg += "\n\nContame todo junto, como quieras decirlo, y voy completando lo que falte. En cualquier momento podés escribir \"cancelar\".";
        return msg;
    }

    // Vuelca lo que Groq extrajo del mensaje sobre los datos ya guardados de la conversación,
    // sin pisar lo que ya estaba confirmado.
    mergearDatos(estado, ex) {
        const d = estado.datos;

        if (estado.intent === 'crear_cliente') {
            if (ex.nombre && !d.nombre) d.nombre = ex.nombre;
            if (ex.direccion && !d.direccion) d.direccion = ex.direccion;
            if (ex.telefono !== null && ex.telefono !== undefined && d.telefono === undefined) d.telefono = ex.telefono;
            if (ex.dia_reparto && !d.dia_reparto) d.dia_reparto = ex.dia_reparto;
            return;
        }

        if (estado.intent === 'registrar_venta') {
            if (estado.paso === 'elegir_cliente' && ex.eleccion_numero) {
                const elegido = (d.opciones || [])[ex.eleccion_numero - 1];
                if (elegido) { d.cliente = elegido; delete d.opciones; }
            }
            if (!d.cliente && ex.cliente_nombre_buscar) d.clienteNombre = ex.cliente_nombre_buscar;
            if (ex.cantidad_bidones != null && !d.cantidad_bidones && !d.monto) d.cantidad_bidones = ex.cantidad_bidones;
            if (ex.monto != null && !d.cantidad_bidones && !d.monto) d.monto = ex.monto;
            if (ex.estado_pago != null && (d.estado_pago === undefined || d.estado_pago === null)) d.estado_pago = ex.estado_pago;
            return;
        }

        if (estado.intent === 'pagar_fiado') {
            if (estado.paso === 'elegir_cliente' && ex.eleccion_numero) {
                const elegido = (d.opciones || [])[ex.eleccion_numero - 1];
                if (elegido) { d.clienteActual = elegido; delete d.opciones; }
            }
            if (!d.clienteActual && ex.cliente_nombre_buscar) d.clienteNombre = ex.cliente_nombre_buscar;
            if (estado.paso === 'elegir_cuenta' && ex.eleccion_numero) {
                const elegida = (d.cuentas || [])[ex.eleccion_numero - 1];
                if (elegida) d.cuenta = elegida;
            }
            if (ex.tipo_saldo && !d.tipo) d.tipo = ex.tipo_saldo;
            if (ex.monto_parcial != null && !d.montoParcial) d.montoParcial = ex.monto_parcial;
            if (ex.metodo_pago != null && !d.metodoPago) d.metodoPago = ex.metodo_pago;
            return;
        }

        if (estado.intent === 'cambiar_precio') {
            if (ex.nuevo_precio != null && !d.nuevo_precio) d.nuevo_precio = ex.nuevo_precio;
            return;
        }

        if (estado.intent === 'consultar_gastos') {
            if (ex.fecha_inicio && !d.fecha_inicio) d.fecha_inicio = ex.fecha_inicio;
            if (ex.fecha_fin && !d.fecha_fin) d.fecha_fin = ex.fecha_fin;
            return;
        }

        if (estado.intent === 'registrar_gasto') {
            if (ex.categoria_nombre && !d.categoria && !d.categoriaNombre) d.categoriaNombre = ex.categoria_nombre;
            if (ex.monto != null && !d.monto) d.monto = ex.monto;
            if (ex.descripcion !== null && ex.descripcion !== undefined && d.descripcion === undefined) d.descripcion = ex.descripcion;
            if (ex.fecha_gasto && !d.fecha_gasto) d.fecha_gasto = ex.fecha_gasto;
            return;
        }
    }

    async avanzar(req) {
        const estado = req.session.asistente;
        switch (estado.intent) {
            case 'crear_cliente': return await this.avanzarCrearCliente(req);
            case 'registrar_venta': return await this.avanzarRegistrarVenta(req);
            case 'pagar_fiado': return await this.avanzarPagarFiado(req);
            case 'cambiar_precio': return await this.avanzarCambiarPrecio(req);
            case 'consultar_gastos': return await this.avanzarConsultarGastos(req);
            case 'registrar_gasto': return await this.avanzarRegistrarGasto(req);
            default:
                req.session.asistente = estadoVacio();
                return this.mensajeAyuda(req.session.usuario.rol);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CREAR CLIENTE
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarCrearCliente(req) {
        const estado = req.session.asistente;
        const rol = req.session.usuario.rol;
        const d = estado.datos;

        if (!d.nombre) {
            estado.paso = 'nombre';
            return "Dale, vamos a crear un cliente nuevo. ¿Cuál es el nombre?";
        }
        if (!d.direccion) {
            estado.paso = 'domicilio';
            return `Nombre: ${d.nombre}. ¿Cuál es el domicilio?`;
        }
        if (d.telefono === undefined) {
            estado.paso = 'telefono';
            return "¿Y el número de teléfono? (si no tenés, decime \"ninguno\")";
        }
        if (rol === 'gabriel' && !d.dia_reparto) {
            estado.paso = 'dia';
            return "¿Qué día le corresponde el reparto? (lunes, martes, miércoles, jueves, viernes o sábado)";
        }
        return await this.confirmarCrearCliente(req);
    }

    async confirmarCrearCliente(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const { nombre, direccion, telefono, dia_reparto } = estado.datos;

        await clienteModel.guardarCliente({
            nombre, direccion, telefono,
            usuario_id: usuarioId,
            dia_reparto: dia_reparto || null
        });

        req.session.asistente = estadoVacio();
        let msg = `Listo ✅ Creé el cliente "${nombre}"`;
        if (direccion) msg += ` en ${direccion}`;
        if (dia_reparto) msg += ` (reparto los ${dia_reparto})`;
        msg += ".";
        return msg;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CAMBIAR PRECIO DEL BIDÓN
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarCambiarPrecio(req) {
        const estado = req.session.asistente;
        const d = estado.datos;

        if (d.nuevo_precio == null || isNaN(d.nuevo_precio) || d.nuevo_precio <= 0) {
            estado.paso = 'nuevo_precio';
            return "Dale, ¿cuál es el nuevo precio del bidón?";
        }

        const usuarioId = req.session.usuario.id;
        await usuarioModel.actualizarPrecioUsuario(usuarioId, d.nuevo_precio);

        const nuevoPrecio = d.nuevo_precio;
        req.session.asistente = estadoVacio();
        return `Listo ✅ Actualicé el precio del bidón a $${formatearMoneda(nuevoPrecio)}.`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRAR VENTA / ENTREGA
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarRegistrarVenta(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;

        if (!d.cliente) {
            if (!d.clienteNombre) {
                estado.paso = 'cliente';
                return "¿A qué cliente? (decime el nombre)";
            }
            const clientes = await clienteModel.obtenerClientesFiltrados(usuarioId, d.clienteNombre);
            if (!clientes || clientes.length === 0) {
                const buscado = d.clienteNombre;
                d.clienteNombre = null;
                estado.paso = 'cliente';
                return `No encontré ningún cliente que coincida con "${buscado}". Decime el nombre de nuevo, o escribí "cancelar".`;
            }
            if (clientes.length > 1) {
                estado.paso = 'elegir_cliente';
                d.opciones = clientes.slice(0, 8);
                const lista = d.opciones.map((c, i) => `${i + 1}. ${c.nombre}${c.direccion ? ' - ' + c.direccion : ''}`).join("\n");
                return `Encontré varios clientes, decime el número:\n${lista}`;
            }
            d.cliente = clientes[0];
        }

        if (!d.cantidad_bidones && !d.monto) {
            estado.paso = 'cantidad';
            return `Cliente: ${d.cliente.nombre}. ¿Cuántos bidones le llevás? (o decime un monto en pesos)`;
        }

        if (d.estado_pago === undefined || d.estado_pago === null) {
            estado.paso = 'estado_pago';
            return "¿Cómo quedó? Pagado, fiado o transferencia.";
        }

        return await this.ejecutarVenta(req);
    }

    async ejecutarVenta(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;
        const cliente = d.cliente;

        let cantidadFinal, precio_bidon, total;
        if (d.monto) {
            cantidadFinal = d.monto;
            precio_bidon = 1;
            total = d.monto;
        } else {
            precio_bidon = await usuarioModel.obtenerPrecioUsuario(usuarioId);
            cantidadFinal = d.cantidad_bidones;
            total = cantidadFinal * precio_bidon;
        }

        await clienteModel.agregarCuenta({
            cliente_id: cliente.id,
            estado_pago: d.estado_pago,
            cantidad_bidones: cantidadFinal,
            precio_bidon,
            total
        });

        try {
            const tipoPago = d.estado_pago == 1 ? 'Pagado' : d.estado_pago == 0 ? 'Fiado' : 'Transferencia';
            await stockGastosModel.descontarStock(usuarioId, cantidadFinal, `Venta a ${cliente.nombre} (${tipoPago}) - vía WalterBot`);
        } catch (e) {
            console.error("Error al descontar stock desde WalterBot:", e);
        }

        await clienteModel.quitarEntregaHoy(cliente.id);

        const tipoTexto = d.estado_pago == 1 ? 'pagada' : d.estado_pago == 0 ? 'fiada' : 'transferida';
        req.session.asistente = estadoVacio();
        return `Listo ✅ Registré la entrega a ${cliente.nombre} por $${formatearMoneda(total)} como ${tipoTexto}.`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SALDAR FIADO
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarPagarFiado(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;

        if (!d.clienteActual) {
            if (!d.clienteNombre) {
                estado.paso = 'cliente';
                return "Bien, vamos a saldar una cuenta fiada. ¿De qué cliente? (decime el nombre)";
            }
            const clientes = await clienteModel.obtenerClientesFiltrados(usuarioId, d.clienteNombre);
            if (!clientes || clientes.length === 0) {
                const buscado = d.clienteNombre;
                d.clienteNombre = null;
                estado.paso = 'cliente';
                return `No encontré ningún cliente que coincida con "${buscado}". Decime el nombre de nuevo, o escribí "cancelar".`;
            }
            if (clientes.length > 1) {
                estado.paso = 'elegir_cliente';
                d.opciones = clientes.slice(0, 8);
                const lista = d.opciones.map((c, i) => `${i + 1}. ${c.nombre}`).join("\n");
                return `Encontré varios, decime el número:\n${lista}`;
            }
            d.clienteActual = clientes[0];
        }

        if (!d.cuenta) {
            if (!d.cuentas) {
                const fiados = await clienteModel.obtenerCuentasFiadasPorCliente(d.clienteActual.id);
                if (!fiados || fiados.length === 0) {
                    const nombreCliente = d.clienteActual.nombre;
                    req.session.asistente = estadoVacio();
                    return `${nombreCliente} no tiene cuentas fiadas pendientes. ¿Te ayudo con algo más?`;
                }
                d.cuentas = fiados;
            }
            if (d.cuentas.length === 1) {
                d.cuenta = d.cuentas[0];
            } else {
                estado.paso = 'elegir_cuenta';
                const lista = d.cuentas.map((c, i) =>
                    `${i + 1}. $${formatearMoneda(c.total)} - ${c.cantidad_bidones} bidones (${formatearFecha(c.fecha_publicacion)})`
                ).join("\n");
                return `Cuentas fiadas de ${d.clienteActual.nombre}:\n${lista}\n\nDecime el número de la cuenta que querés saldar.`;
            }
        }

        if (!d.tipo) {
            estado.paso = 'tipo_saldo';
            return `Cuenta de $${formatearMoneda(d.cuenta.total)} (${d.cuenta.cantidad_bidones} bidones). ¿Pago completo o parcial?`;
        }

        if (d.tipo === 'parcial' && !d.montoParcial) {
            estado.paso = 'monto_parcial';
            return `¿Cuánto te pagó? (el total de la cuenta es $${formatearMoneda(d.cuenta.total)})`;
        }

        if (!d.metodoPago) {
            estado.paso = d.tipo === 'completo' ? 'metodo_completo' : 'metodo_parcial';
            return "¿Cómo se pagó? Efectivo o transferencia.";
        }

        return await this.ejecutarSaldo(req);
    }

    async ejecutarSaldo(req) {
        const estado = req.session.asistente;
        const d = estado.datos;
        const cliente = d.clienteActual;

        if (d.tipo === 'completo') {
            await clienteModel.actualizarEstadoPago(d.cuenta.id, d.metodoPago);
            req.session.asistente = estadoVacio();
            return `Listo ✅ Marqué la cuenta de ${cliente.nombre} como ${d.metodoPago === 1 ? 'pagada (efectivo)' : 'transferencia'}.`;
        } else {
            await clienteModel.registrarPagoParcial(d.cuenta.id, d.montoParcial, d.metodoPago);
            const montoParcial = d.montoParcial;
            req.session.asistente = estadoVacio();
            return `Listo ✅ Registré un pago parcial de $${formatearMoneda(montoParcial)} (${d.metodoPago === 1 ? 'efectivo' : 'transferencia'}) para ${cliente.nombre}.`;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSULTAR GASTOS (solo usuario 'gabriel')
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarConsultarGastos(req) {
        const estado = req.session.asistente;
        const rol = req.session.usuario.rol;
        const d = estado.datos;

        if (rol !== 'gabriel') {
            req.session.asistente = estadoVacio();
            return "La consulta de gastos solo está disponible para el usuario gabriel.";
        }

        if (!d.fecha_inicio || !d.fecha_fin) {
            estado.paso = 'rango_fechas';
            return "¿De qué fecha o rango de fechas querés ver los gastos? (ej: \"el miércoles 9 de septiembre\", \"entre el martes y el jueves\", \"los últimos 3 días\")";
        }

        return await this.ejecutarConsultaGastos(req);
    }

    async ejecutarConsultaGastos(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;

        const gastos = await stockGastosModel.obtenerGastos(usuarioId, d.fecha_inicio, d.fecha_fin);
        req.session.asistente = estadoVacio();

        const rangoTexto = d.fecha_inicio === d.fecha_fin
            ? formatearFecha(d.fecha_inicio)
            : `${formatearFecha(d.fecha_inicio)} al ${formatearFecha(d.fecha_fin)}`;

        if (!gastos || gastos.length === 0) {
            return `No encontré gastos registrados entre el ${rangoTexto}.`;
        }

        const total = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);
        const lista = gastos.map(g =>
            `• ${formatearFecha(g.fecha_gasto)} - ${g.categoria_nombre}: $${formatearMoneda(g.monto)}${g.descripcion ? ' (' + g.descripcion + ')' : ''}`
        ).join("\n");

        return `Gastos del ${rangoTexto}:\n${lista}\n\nTotal: $${formatearMoneda(total)} (${gastos.length} ${gastos.length === 1 ? 'gasto' : 'gastos'}).`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRAR GASTO (solo usuario 'gabriel')
    // ═══════════════════════════════════════════════════════════════════════
    async avanzarRegistrarGasto(req) {
        const estado = req.session.asistente;
        const rol = req.session.usuario.rol;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;

        if (rol !== 'gabriel') {
            req.session.asistente = estadoVacio();
            return "Registrar gastos solo está disponible para el usuario gabriel.";
        }

        if (!d.categoria) {
            if (!d.categoriaNombre) {
                estado.paso = 'categoria';
                return "Dale, vamos a registrar un gasto. ¿En qué categoría? (ej: combustible, mantenimiento, insumos)";
            }

            const nombreBuscado = d.categoriaNombre.trim();
            const categorias = await stockGastosModel.obtenerCategorias(usuarioId);
            let categoria = categorias.find(c => c.nombre.toLowerCase() === nombreBuscado.toLowerCase());

            if (!categoria) {
                try {
                    const categoriaId = await stockGastosModel.crearCategoria(usuarioId, nombreBuscado);
                    categoria = { id: categoriaId, nombre: nombreBuscado };
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        const categoriasActualizadas = await stockGastosModel.obtenerCategorias(usuarioId);
                        categoria = categoriasActualizadas.find(c => c.nombre.toLowerCase() === nombreBuscado.toLowerCase());
                    }
                    if (!categoria) {
                        console.error("Error creando categoría desde WalterBot:", error);
                        d.categoriaNombre = null;
                        estado.paso = 'categoria';
                        return "Tuve un problema para crear esa categoría. Decime el nombre de nuevo.";
                    }
                }
            }
            d.categoria = categoria;
        }

        if (!d.monto) {
            estado.paso = 'monto';
            return `Categoría: ${d.categoria.nombre}. ¿Cuánto gastaste? (monto en pesos)`;
        }

        if (d.descripcion === undefined) {
            estado.paso = 'descripcion';
            return "¿Querés agregar una descripción? (o decime \"ninguna\")";
        }

        return await this.ejecutarRegistrarGasto(req);
    }

    async ejecutarRegistrarGasto(req) {
        const estado = req.session.asistente;
        const usuarioId = req.session.usuario.id;
        const d = estado.datos;

        const fechaGasto = d.fecha_gasto || obtenerFechaLocal();
        const descripcion = d.descripcion || null;

        await stockGastosModel.registrarGasto(usuarioId, d.categoria.id, d.monto, descripcion, fechaGasto);

        const msg = `Listo ✅ Registré un gasto de $${formatearMoneda(d.monto)} en "${d.categoria.nombre}"` +
            (descripcion ? ` (${descripcion})` : '') +
            ` con fecha ${formatearFecha(fechaGasto)}.`;

        req.session.asistente = estadoVacio();
        return msg;
    }
}

module.exports = AsistenteController;