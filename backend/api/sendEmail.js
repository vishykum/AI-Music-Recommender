const nodemailer = require('nodemailer');
const { cmdLogger, persistentLogger } = require('../logger');
const dns = require('dns').promises;
const validator = require('validator');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL_ID,
        pass: process.env.AUTH_EMAIL_PASSWORD
    }
});

async function verifyEmail(email) {
    //Check format
    if (!validator.isEmail(email)) {
        cmdLogger.error('Invalid email format: ' + email);
        persistentLogger.error({
            method: "POST",
            url: "/users/send_verification_email",
            status: "400",
            message: "Invalid email format",
            email_id: email
        });
        return false;
    }

    //Check domain has MX records
    const domain = email.split('@')[1];
    try {
        const addresses = await dns.resolveMx(domain);
        
        cmdLogger.info('Email id verified successfully: ');
        return addresses && addresses.length > 0;
    } catch (error) {
        cmdLogger.error('Error resolving MX records for domain: ' + domain, error);
        persistentLogger.error({
            method: "POST",
            url: "/users/send_verification_email",
            status: "400",
            message: "Error resolving MX records for domain",
            email_id: email,
            error: error
        });
        return false;
    }
}

async function sendVerificationEmail(to, link) {
    try {
        await transporter.sendMail({
        from: process.env.AUTH_EMAIL_ID,
        to: to,
        subject: 'Email Verification',
        text: `Click the link to verify your email: ${link}`
    });
    } catch (error) {
        cmdLogger.error('Error sending email: ', error);
        persistentLogger.error({
            method: "POST",
            url: "/users/send_verification_email",
            status: "400",
            message: "Error sending verification email",
            to: to,
            error: error
        });
        return false;
    }

    cmdLogger.info('Verification email sent successfully to: ' + to);
    persistentLogger.info({
        method: "POST",
        url: "/users/send_verification_email",
        status: "200",
        message: "Verification email sent successfully",
        email_id: to
    });
    return true;
}

module.exports.sendVerificationEmail = sendVerificationEmail;
module.exports.verifyEmail = verifyEmail;