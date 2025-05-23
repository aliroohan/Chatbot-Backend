const jwt = require('jsonwebtoken')
const Admin= require('../models/admin')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await Admin.findOne({ _id: decoded._id })

        if (!user) {
            throw new Error()
        }



        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Please authenticate'
        })
    }
}



module.exports = {
    auth
}