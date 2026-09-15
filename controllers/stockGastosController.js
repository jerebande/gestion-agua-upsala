const StockGastosModel = require("../models/stockGastos");
const stockGastosModel = new StockGastosModel();
const { obtenerFechaLocal } = require("../utils/fecha");

// Valida fechas en formato ISO estricto (YYYY-MM-DD), evitando la ambigüedad
// de Date.parse() con formatos regionales (ej: interpreta "15/09/2026" como
// mes 15, día 9 -> NaN -> "fecha inválida" para cualquier día > 12).
function esFechaValida(fecha) {
    if (typeof fecha !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (!match) return false;
    const [, y, m, d] = match.map(Number);
    const fechaObj = new Date(y, m - 1, d);
    return fechaObj.getFullYear() === y && fechaObj.getMonth() === m - 1 && fechaObj.getDate() === d;
}

class StockGastosController {
    
    // ========== VISTA PRINCIPAL ==========
    
    async mostrarPanel(req, res) {
        if (!req.session.usuario) return res.redirect("/login");

        const esGabriel = req.session.usuario.rol === 'gabriel';

        try {
            const usuarioId = req.session.usuario.id;
            // El stock lo puede ver cualquier usuario autenticado
            const stockActual = await stockGastosModel.obtenerStock(usuarioId);
            const movimientos = await stockGastosModel.obtenerMovimientosStock(usuarioId, 20);

            // Los gastos (categorías, resumen, listado) solo se cargan y muestran para 'gabriel'
            let categorias = [];
            let resumenGastos = { porCategoria: [], totalGeneral: 0 };
            let gastosRecientes = [];
            const periodo = req.query.periodo || 'mes';

            if (esGabriel) {
                categorias = await stockGastosModel.obtenerCategorias(usuarioId);
                resumenGastos = await stockGastosModel.obtenerResumenGastos(usuarioId, periodo);
                gastosRecientes = (await stockGastosModel.obtenerGastos(usuarioId)).slice(0, 20);
            }

            const flash = req.session.flash || null;
            req.session.flash = null;

            res.render("stock-gastos", {
                nombreUsuario: req.session.usuario.nombre,
                usuarioId,
                usuarioRol: req.session.usuario.rol,
                esGabriel,
                stockActual,
                categorias,
                movimientos,
                resumenGastos,
                gastosRecientes,
                periodo,
                flash
            });
        } catch (error) {
            console.error("Error al cargar panel stock/gastos:", error);
            res.status(500).send("Error del servidor");
        }
    }

    // ========== STOCK ==========
    
    async actualizarStock(req, res) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: "No autorizado" });
        }
        
        const { cantidad, operacion } = req.body;
        const usuarioId = req.session.usuario.id;
        
        if (cantidad === undefined || isNaN(cantidad)) {
            return res.status(400).json({ error: "Cantidad inválida" });
        }
        
        try {
            const cant = parseFloat(cantidad);
            
            if (operacion === 'set') {
                await stockGastosModel.actualizarStock(usuarioId, cant, 'set');
            } else if (operacion === 'sumar') {
                await stockGastosModel.ingresarStock(usuarioId, cant, 'Ingreso manual');
            }
            
            const nuevoStock = await stockGastosModel.obtenerStock(usuarioId);
            
            res.json({ success: true, nuevoStock });
        } catch (error) {
            console.error("Error al actualizar stock:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async obtenerStockAPI(req, res) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: "No autorizado" });
        }
        
        try {
            const stock = await stockGastosModel.obtenerStock(req.session.usuario.id);
            res.json({ stock });
        } catch (error) {
            console.error("Error al obtener stock:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    // ========== CATEGORÍAS ==========
    
    async crearCategoria(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const { nombre } = req.body;
        const usuarioId = req.session.usuario.id;
        
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ error: "El nombre es obligatorio" });
        }
        
        if (nombre.trim().length > 100) {
            return res.status(400).json({ error: "El nombre no puede superar 100 caracteres" });
        }
        
        try {
            const categoriaId = await stockGastosModel.crearCategoria(usuarioId, nombre.trim());
            res.json({ success: true, categoriaId, nombre: nombre.trim() });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
            }
            console.error("Error al crear categoría:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async obtenerCategoriasAPI(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const usuarioId = req.session.usuario.id;

        try {
            const categorias = await stockGastosModel.obtenerCategorias(usuarioId);
            res.json({ categorias });
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async eliminarCategoria(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const { id } = req.params;
        const usuarioId = req.session.usuario.id;
        
        try {
            const eliminado = await stockGastosModel.eliminarCategoria(id, usuarioId);
            if (eliminado) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Categoría no encontrada" });
            }
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    // ========== GASTOS ==========
    
    async registrarGasto(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const { categoria_id, monto, descripcion } = req.body;
        const usuarioId = req.session.usuario.id;
        const fechaGasto = req.body.fecha_gasto || obtenerFechaLocal();
        
        if (!categoria_id) {
            return res.status(400).json({ error: "Seleccioná una categoría" });
        }
        
        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        if (req.body.fecha_gasto && !esFechaValida(req.body.fecha_gasto)) {
            return res.status(400).json({ error: "Fecha inválida" });
        }
        
        try {
            const gastoId = await stockGastosModel.registrarGasto(
                usuarioId,
                categoria_id,
                parseFloat(monto),
                descripcion || null,
                fechaGasto
            );
            
            res.json({ success: true, gastoId });
        } catch (error) {
            console.error("Error al registrar gasto:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async actualizarGasto(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const { id } = req.params;
        const { categoria_id, monto, descripcion, fecha_gasto } = req.body;
        const usuarioId = req.session.usuario.id;

        if (!categoria_id) {
            return res.status(400).json({ error: "Seleccioná una categoría" });
        }

        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        if (!fecha_gasto || !esFechaValida(fecha_gasto)) {
            return res.status(400).json({ error: "Fecha inválida" });
        }

        try {
            const actualizado = await stockGastosModel.actualizarGasto(id, usuarioId, {
                categoria_id,
                monto: parseFloat(monto),
                descripcion: descripcion || null,
                fecha_gasto
            });

            if (actualizado) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Gasto no encontrado" });
            }
        } catch (error) {
            console.error("Error al actualizar gasto:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async eliminarGasto(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const { id } = req.params;
        const usuarioId = req.session.usuario.id;
        
        try {
            const eliminado = await stockGastosModel.eliminarGasto(id, usuarioId);
            if (eliminado) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Gasto no encontrado" });
            }
        } catch (error) {
            console.error("Error al eliminar gasto:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async obtenerGastosAPI(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const usuarioId = req.session.usuario.id;
        const { fechaInicio, fechaFin } = req.query;
        
        try {
            const gastos = await stockGastosModel.obtenerGastos(usuarioId, fechaInicio, fechaFin);
            res.json({ gastos });
        } catch (error) {
            console.error("Error al obtener gastos:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }

    async obtenerResumenGastosAPI(req, res) {
        if (!req.session.usuario || req.session.usuario.rol !== 'gabriel') {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        const usuarioId = req.session.usuario.id;
        const periodo = req.query.periodo || 'mes';
        
        try {
            const resumen = await stockGastosModel.obtenerResumenGastos(usuarioId, periodo);
            res.json(resumen);
        } catch (error) {
            console.error("Error al obtener resumen:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    }
}

module.exports = StockGastosController;