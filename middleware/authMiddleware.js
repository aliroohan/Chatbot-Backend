const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to find user in both Admin and User collections
        let user = await User.findOne({ _id: decoded.id });
        
        // If not found in Admin, try User collection
        if (!user) {
            user = await User.findOne({ _id: decoded._id });
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Please authenticate'
        });
    }
};

module.exports = authMiddleware; 