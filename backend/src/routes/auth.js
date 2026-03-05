const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/loginRateLimiter');
const { validateRequest } = require('../middleware/validateRequest');
const { authSchemas } = require('../schemas/authSchemas');

router.post('/login', loginRateLimiter, validateRequest(authSchemas.login), authController.login);
router.post('/register', authenticate, authController.register);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.get('/permissions', authenticate, authController.getPermissions);

module.exports = router;
