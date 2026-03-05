const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const ctrl = require('../controllers/simulationController');
router.use(authenticate);
router.post('/run', checkPermission('simulation.run'), ctrl.runSimulation);
router.post('/:id/save', checkPermission('simulation.run'), ctrl.saveSimulation);
router.get('/history', checkPermission('simulation.view'), ctrl.listSimulations);
router.get('/:id', checkPermission('simulation.view'), ctrl.getSimulation);

// alias for legacy spec
router.post('/production-simulation', checkPermission('simulation.run'), ctrl.runSimulation);
module.exports = router;
