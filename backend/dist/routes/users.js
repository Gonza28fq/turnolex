"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ruta pública — registro de clientes
router.post('/register-cliente', userController_1.registrarCliente);
// Rutas protegidas
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('admin'), userController_1.getUsuarios);
router.get('/:id', (0, auth_1.authorize)('admin'), userController_1.getUsuarioById);
router.post('/abogado', (0, auth_1.authorize)('admin'), userController_1.crearAbogado);
router.put('/:id/password', userController_1.changePassword);
router.put('/:id', (0, auth_1.authorize)('admin'), userController_1.updateUsuario);
router.delete('/:id', (0, auth_1.authorize)('admin'), userController_1.deleteUsuario);
exports.default = router;
