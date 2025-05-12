const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');



router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/verify-email', userController.verifyEmail);
router.post('/resend-otp', userController.resendVerificationOtp);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/generate-otp', userController.generateOtp);
router.post('/verify-otp', userController.verifyOtp);

module.exports = router;
