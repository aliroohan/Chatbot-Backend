const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    generateOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    approveEmail,
    rejectEmail
} = require('../controllers/adminController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/generate-otp', generateOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/approve/:token', approveEmail);
router.post('/reject/:token', rejectEmail);
module.exports = router;