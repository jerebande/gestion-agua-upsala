const express = require("express");
const router = express.Router();
const StockGastosController = require("../controllers/stockGastosController");
const stockGastosController = new StockGastosController();

// Middleware: solo usuarios gabriel (para gastos y edición de stock)
function soloGabriel(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }
    if (req.session.usuario.rol !== 'gabriel') {
        return res.status(403).send("Acceso denegado");
    }
    next();
}

// Middleware: cualquier usuario autenticado (para ver el stock)
function verificarAutenticado(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }
    next();
}

// Vista principal — accesible a cualquier usuario logueado; el controller decide qué datos entregar según el rol
router.get("/stock-gastos", verificarAutenticado, (req, res) => stockGastosController.mostrarPanel(req, res));

// API Stock
router.get("/api/stock", verificarAutenticado, (req, res) => stockGastosController.obtenerStockAPI(req, res));
router.post("/api/stock/actualizar", verificarAutenticado, (req, res) => stockGastosController.actualizarStock(req, res));

// API Categorías
router.post("/api/categorias-gastos", soloGabriel, (req, res) => stockGastosController.crearCategoria(req, res));
router.delete("/api/categorias-gastos/:id", soloGabriel, (req, res) => stockGastosController.eliminarCategoria(req, res));

// API Gastos
router.get("/api/gastos", soloGabriel, (req, res) => stockGastosController.obtenerGastosAPI(req, res));
router.post("/api/gastos", soloGabriel, (req, res) => stockGastosController.registrarGasto(req, res));
router.put("/api/gastos/:id", soloGabriel, (req, res) => stockGastosController.actualizarGasto(req, res));
router.delete("/api/gastos/:id", soloGabriel, (req, res) => stockGastosController.eliminarGasto(req, res));
router.get("/api/gastos/resumen", soloGabriel, (req, res) => stockGastosController.obtenerResumenGastosAPI(req, res));

module.exports = router;