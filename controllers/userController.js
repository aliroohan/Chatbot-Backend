const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailService');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.registerUser = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const otp = generateOTP();

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const user = await User.create({
            name,
            username,
            email,
            password,
            isVerified: false,
            otp: {
                code: otp,
                expiresAt
            }
        });

        if (user) {
            const emailSent = await sendOtpEmail(email, otp);

            if (!emailSent) {
                return res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    isVerified: false,
                    message: 'Account created but failed to send verification email. Please request a new OTP.'
                });
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                isVerified: false,
                message: 'Registration successful. Please verify your email with the OTP sent to your email address.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Check if OTP exists and is valid
        if (!user.otp.code || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Mark user as verified
        user.isVerified = true;

        // Clear OTP after successful verification
        user.otp = {
            code: null,
            expiresAt: null
        };

        await user.save();

        res.status(200).json({
            message: 'Email verified successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: true,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

// Resend verification OTP
exports.resendVerificationOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Set OTP expiration (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Save OTP to user
        user.otp = {
            code: otp,
            expiresAt
        };

        await user.save();

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ message: 'Verification OTP has been resent to your email' });
        } else {
            res.status(500).json({ message: 'Failed to send verification OTP' });
        }
    } catch (error) {
        console.error('Resend verification OTP error:', error);
        res.status(500).json({ message: 'Server error during OTP generation' });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Email not verified. Please verify your email before logging in.',
                isVerified: false,
                email: user.email
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching user profile' });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;

        // If email is being changed, require verification again
        if (req.body.email && req.body.email !== user.email) {
            // Check if the new email is already in use
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            user.email = req.body.email;
            user.isVerified = false;

            // Generate new OTP for email verification
            const otp = generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            user.otp = {
                code: otp,
                expiresAt
            };

            // Send verification email to new email address
            await sendOtpEmail(req.body.email, otp);
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            isVerified: updatedUser.isVerified,
            token: generateToken(updatedUser._id),
            message: updatedUser.isVerified ? 'Profile updated successfully' : 'Profile updated. Please verify your new email address.'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating user profile' });
    }
};

// Generate and send OTP to user's email
exports.generateOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Set OTP expiration (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Save OTP to user
        user.otp = {
            code: otp,
            expiresAt
        };

        await user.save();

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ message: 'OTP has been sent to your email' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({ message: 'Server error during OTP generation' });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP exists and is valid
        if (!user.otp.code || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Clear OTP after successful verification
        user.otp = {
            code: null,
            expiresAt: null
        };

        await user.save();

        res.status(200).json({
            message: 'OTP verified successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// Request password reset (using OTP)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Set OTP expiration (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Save OTP to user
        user.otp = {
            code: otp,
            expiresAt
        };

        await user.save();

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ message: 'Password reset OTP has been sent to your email' });
        } else {
            res.status(500).json({ message: 'Failed to send password reset OTP' });
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// Reset password using OTP
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP exists and is valid
        if (!user.otp.code || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Update password
        user.password = newPassword;

        // Clear OTP after successful password reset
        user.otp = {
            code: null,
            expiresAt: null
        };

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};