const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authenticate, authController.register);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.get('/permissions', authenticate, authController.getPermissions);

module.exports = router;
