const express = require("express");
const router = express.Router();
const ClienteController = require("../controllers/clientes");
const clienteController = new ClienteController();
router.post("/clientes/:id/actualizar", (req, res) => clienteController.actualizarCliente(req, res));
router.post("/clientes/:id/cuentas", (req, res) => clienteController.agregarCuenta(req, res));
router.delete("/clientes/:id", (req, res) => clienteController.eliminarCliente(req, res));
router.post("/clientes/:idCliente/cuentas/:idCuenta/eliminar", clienteController.eliminarCuenta.bind(clienteController));
router.post("/clientes/:id/bidones", clienteController.actualizarBidones.bind(clienteController));
router.get("/historial/cuentas", clienteController.listarCuentasPorFecha);
router.get("/clientes", (req, res) => clienteController.listarClientes(req, res));
router.get("/clientes/:id", (req, res) => clienteController.obtenerClientePorId(req, res));

router.post("/clientes", (req, res) => clienteController.guardarCliente(req, res));


router.post("/clientes/:idCliente/cuentas/:idCuenta/actualizarEstadoPago", (req, res) => clienteController.actualizarEstadoPago(req, res));






module.exports = router;
