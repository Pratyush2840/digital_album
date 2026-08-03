const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendPasswordResetEmail(toEmail, resetUrl) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Reset your Mini Insta password',
        html: `
            <p>You requested a password reset for your Mini Insta account.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        `
    });
}

module.exports = { sendPasswordResetEmail };
