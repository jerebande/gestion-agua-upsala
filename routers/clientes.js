const express = require("express");
const router = express.Router();
const ClienteController = require("../controllers/clientes");
const clienteController = new ClienteController();

router.post("/clientes/:id/actualizar", (req, res) => clienteController.actualizarCliente(req, res));
router.post("/clientes/:id/cuentas", (req, res) => clienteController.agregarCuenta(req, res));
router.delete("/clientes/:id", (req, res) => clienteController.eliminarCliente(req, res));
router.post("/clientes/:idCliente/cuentas/:idCuenta/eliminar", (req, res) => clienteController.eliminarCuenta(req, res));
router.post("/clientes/:id/bidones", (req, res) => clienteController.actualizarBidones(req, res));
router.get("/historial/cuentas", (req, res) => clienteController.listarCuentasPorFecha(req, res));
router.get("/clientes", (req, res) => clienteController.listarClientes(req, res));
router.get("/clientes/:id", (req, res) => clienteController.obtenerClientePorId(req, res));
router.post("/clientes/:id/actualizar-bidones", (req, res) => clienteController.actualizarBidones(req, res));
router.post("/clientes", (req, res) => clienteController.guardarCliente(req, res));

router.post("/clientes/:idCliente/cuentas/:idCuenta/actualizarEstadoPago", (req, res) => clienteController.actualizarEstadoPago(req, res));
router.post("/clientes/:idCliente/cuentas/:idCuenta/pago-parcial", (req, res) => clienteController.registrarPagoParcial(req, res));

// Ruta para actualizar datos básicos
router.put("/clientes/:id", (req, res) => clienteController.actualizarDatosBasicos(req, res));

// ----- RUTAS PARA ESTADOS SEMANALES -----
router.post("/clientes/:id/estado-semanal", (req, res) => clienteController.guardarEstadoSemanal(req, res));
router.delete("/clientes/estado-semanal/:id", (req, res) => clienteController.eliminarEstadoSemanal(req, res));

// ----- NUEVAS RUTAS PARA ENTREGA HOY -----
router.post("/clientes/:id/entrega-hoy", (req, res) => clienteController.marcarEntregaHoy(req, res));
router.delete("/clientes/:id/entrega-hoy", (req, res) => clienteController.quitarEntregaHoy(req, res));

module.exports = router;