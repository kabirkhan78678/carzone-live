import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getMessage } from './user_helper.js';
import { variableTypes } from './constant.js';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

const sendEmail = async (emailOptions) => {
    const mailOptions = {
        from: emailOptions.from || EMAIL_USER,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
        replyTo: emailOptions.replyTo || undefined,
        attachments: emailOptions.attachments || []
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${emailOptions.to}`);
};

const sendSupportEmail = async (emailOptions) => {
    const mailOptions = {
        from: emailOptions.from || emailOptions.to || EMAIL_USER,
        to: ADMIN_EMAIL || EMAIL_USER,
        subject: emailOptions.subject,
        html: emailOptions.html,
        replyTo: emailOptions.replyTo || undefined,
        attachments: emailOptions.attachments || []
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${ADMIN_EMAIL || EMAIL_USER}`);
    } catch (error) {
        throw new Error(getMessage('en', variableTypes.ERROR_SENDING_TO_EMAIL));
    }
};

export const sendInqueryEmail = async (emailOptions) => {
    const mailOptions = {
        from: emailOptions.from || EMAIL_USER,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
        replyTo: emailOptions.replyTo || undefined,
        attachments: emailOptions.attachments || []
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${emailOptions.to} using ${EMAIL_USER}`);
};

export { sendEmail, sendSupportEmail };