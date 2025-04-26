import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpEmailLogin = process.env.SMTP_EMAIL_LOGIN;
const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
	host: smtpHost,
	port: Number(smtpPort),
	secure: false,
	auth: {
		user: smtpEmailLogin,
		pass: smtpPassword,
	},
	from: smtpEmail,
});

// Send Email
const sendEmail = async (options: nodemailer.SendMailOptions): Promise<any> => {
	await transporter.sendMail(options);
};

// Send Email Async
const sendEmailAsync = (options: nodemailer.SendMailOptions) => {
	transporter.sendMail(options);
};

export default sendEmail;
export const emailHelper = {sendEmailAsync}
