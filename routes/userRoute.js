const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    generateOtp,
    verifyOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/userController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/generate-otp', generateOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;