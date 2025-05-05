const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendOtpEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">Your One-Time Password</h2>
                    <p style="font-size: 16px; color: #555;">Please use the following OTP to verify your account:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
                        <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="font-size: 14px; color: #777;">This OTP will expire in 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't request this OTP, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

exports.sendApprovalEmail = async (email, userName, approvalToken, rejectToken) => {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const approvalUrl = `${baseUrl}/approve-user/${approvalToken}`;
        const rejectUrl = `${baseUrl}/reject-user/${rejectToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'aliroohhan123@gmail.com',
            subject: 'User Approval Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">User Approval Request</h2>
                    <p style="font-size: 16px; color: #555;">A new user "${userName}" has requested approval.</p>
                    <p style="font-size: 16px; color: #555;">Please review and take appropriate action:</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${approvalUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px; display: inline-block;">Approve User</a>
                        <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reject User</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #777;">If the buttons don't work, you can copy and paste these URLs into your browser:</p>
                    <p style="font-size: 14px; color: #777;">Approve: ${approvalUrl}</p>
                    <p style="font-size: 14px; color: #777;">Reject: ${rejectUrl}</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending approval email:', error);
        return false;
    }
};

exports.sendUserStatusEmail = async (email, userName, isApproved) => {
    try {
        const status = isApproved ? 'approved' : 'rejected';
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Your Account Has Been ${isApproved ? 'Approved' : 'Rejected'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">Account ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                    <p style="font-size: 16px; color: #555;">Dear ${userName},</p>
                    <p style="font-size: 16px; color: #555;">Your account has been ${status}.</p>
                    ${isApproved ? 
                        `<p style="font-size: 16px; color: #555;">You can now log in and use all the features of our platform.</p>` : 
                        `<p style="font-size: 16px; color: #555;">If you believe this is a mistake, please contact our support team.</p>`
                    }
                    <p style="font-size: 14px; color: #777;">Thank you for your understanding.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('User status email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending user status email:', error);
        return false;
    }
};