"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const turnoController_1 = require("../controllers/turnoController");
const auth_1 = require("../middleware/auth");
const turnoController_2 = require("../controllers/turnoController");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('admin', 'abogado'), turnoController_1.getTurnos);
router.get('/mis-turnos', (0, auth_1.authorize)('abogado'), turnoController_1.getMisTurnos);
router.get('/:id', turnoController_1.getTurnoById);
router.post('/', (0, auth_1.authorize)('admin', 'cliente'), turnoController_1.createTurno);
router.put('/:id/estado', (0, auth_1.authorize)('admin', 'abogado'), turnoController_1.updateTurnoEstado);
router.delete('/:id', (0, auth_1.authorize)('admin'), turnoController_1.deleteTurno);
router.get('/:id/pdf', auth_1.authenticate, turnoController_2.getTurnoPDF);
exports.default = router;
