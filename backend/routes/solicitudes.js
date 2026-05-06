const router = require('express').Router();
const ctrl = require('../controllers/solicitudController');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);
router.post('/', requireRole('estudiante'), ctrl.crear);
router.get('/mias', requireRole('estudiante'), ctrl.getMias);
router.get('/', requireRole('admin'), ctrl.getAll);
router.put('/:id/aprobar', requireRole('admin'), ctrl.aprobar);
router.put('/:id/rechazar', requireRole('admin'), ctrl.rechazar);

module.exports = router;
