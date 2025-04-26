/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import { prisma } from '../client/prisma';
import sendEmail from '../helpers/emailHelper';
import { comparePassword, hashPassword } from '../helpers/passwordHelper';
import {
	generateAccessToken,
	generateForgotPasswordToken,
	verifyForgotPasswordToken,
	verifyVerificationToken,
} from '../helpers/tokenHelper';
import { RequestExtended } from '../interfaces/global';
import { invitationsRepository } from '../repositories/invitationsRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { userRepository } from '../repositories/userRepository';
import { getForgotPasswordTemplate } from '../template/email/forgotPasswordTemplate';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { invalidText } from '../utils/utils';

const resetPasswordUrl = `${process.env.REACT_APP_BASE_URL}/reset-password`;
const smtpEmail = process.env.SMTP_EMAIL;

const loginService = async (req: Request) => {
	const { email, password } = req.body;

	const user = await userRepository.getUserByEmail(email);
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_CREDENTIALS);
	}

	if (!user.isVerified) {
		throw new ApiException(ErrorCodes.USER_NOT_VERIFIED);
	}

	if (user?.role?.status !== true) {
		throw new ApiException(ErrorCodes.UNAUTHORIZED);
	}

	const isPasswordValid = await comparePassword(
		password,
		user.password as string
	);

	if (!isPasswordValid) {
		throw new ApiException(ErrorCodes.INVALID_CREDENTIALS);
	}

	const accessToken = await tokenRepository.getAccessTokenByUser(user.id);

	await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			lastLogin: new Date(),
		},
	});


	if (!user.isActive) {
		throw new ApiException(ErrorCodes.NOT_ACTIVE);
	}

	if (accessToken) {
		await tokenRepository.deleteAccessTokenByUser(user.id);
		const newAccessToken = generateAccessToken({
			id: user.id,
			email,
			isAdmin: user?.role?.isAdmin,
		});
		await tokenRepository.createAccessTokenByUser(user.id, newAccessToken);

		return {
			accessToken: newAccessToken,
			alreadyLogin: true,
			message: 'Login successful.',
		};
	} else {
		const newAccessToken = generateAccessToken({
			id: user.id,
			email,
			isAdmin: user?.role?.isAdmin,
		});
		await tokenRepository.createAccessTokenByUser(user.id, newAccessToken);
		return {
			accessToken: newAccessToken,
			alreadyLogin: false,
			message: 'Login successful',
		};
	}
};

const logoutService = async (req: RequestExtended) => {
	const { id } = req.user;
	await tokenRepository.deleteAccessTokenByUser(id);
	return {
		message: 'Logout successful.',
	};
};

const forgotPassword = async (req: Request) => {
	const { email } = req.body;
	const user = await userRepository.getUserByEmail(email);
	if (!user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}
	// Send email to user with token
	const forgotPasswordToken = generateForgotPasswordToken({
		id: user?.id,
		email: email,
	});

	// Delete tokens from database
	await tokenRepository.deleteForgotPasswordTokenByUser(user?.id);

	// Save token in database
	await tokenRepository.createForgotPasswordTokenByUser(
		user?.id,
		forgotPasswordToken
	);

	const url = `${resetPasswordUrl}?token=${forgotPasswordToken}`;

	const fullName =
		user?.firstName || user?.lastName
			? user?.firstName + ' ' + user?.lastName
			: 'User';

	// Compose email content for the password reset email
	const emailContent = getForgotPasswordTemplate({
		fullName,
		url,
	});

	// Send the email with the reset token
	const mailOptions = {
		from: smtpEmail,
		to: email,
		subject: 'Reset Password - Med-Panel',
		html: emailContent,
	};

	await sendEmail(mailOptions);

	// Return success message
	return {
		message:
			'Password reset link has been sent to your email. Please check your email.',
	};
};

const verifyForgotPassword = async (req: Request) => {
	const { token } = req.query;

	if (!token) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const verified: any = verifyForgotPasswordToken(token);
	if (!verified) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const user = await userRepository.getUserByEmail(verified?.email as string);

	// If user not exists, send error message
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const forgotPasswordToken =
		await tokenRepository.getForgotPasswordTokenByUser(user.id);

	if (!forgotPasswordToken) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	// If forgotPasswordToken not exists in db, send error message
	if (forgotPasswordToken.token !== token) {
		throw new ApiException(ErrorCodes.EXPIRED_TOKEN);
	}

	return true;
};

const changePassword = async (req: Request) => {
	const { token } = req.query;
	const { password, setPassword } = req.body;

	if (!token) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}
	let verified: any;

	if (token)

		
		if (setPassword) {
			const tokenExist = await invitationsRepository.checkInvitationToken(
				token as string
			);
			if (!tokenExist) {
				throw new ApiException(ErrorCodes.INVALID_TOKEN);
			}

			verified = await verifyVerificationToken(token);
			if (!verified) {
				throw new ApiException(ErrorCodes.INVALID_TOKEN);
			}
			await invitationsRepository.updateInvitedUserStatusById(tokenExist?.id);

			await userRepository.verifyUser(verified?.email)

		} else {
			const tokenExist = await tokenRepository.checkForgetPasswordToken(
				token as string
			);
			if (!tokenExist) { 
				throw new ApiException(ErrorCodes.INVALID_TOKEN);
			}
			verified = await verifyForgotPasswordToken(token);

			if (!verified) {
				throw new ApiException(ErrorCodes.INVALID_TOKEN);
			}
		}

	if (!verified) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	// Find user by email from verified token
	const user = await userRepository.getUserByEmail(verified?.email as string);

	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	if (user?.password) {
		const encrypted = await comparePassword(password, user?.password);
		if (encrypted) {
			throw new ApiException(ErrorCodes.INVALID_PASSWORD);
		}
	}

	// Encrypt password
	const hashedPassword = await hashPassword(password);

	// Delete tokens from database
	if (setPassword) {
		await tokenRepository.deleteVerifyTokenByUser(user?.id);
	} else {
		await tokenRepository.deleteForgotPasswordTokenByUser(user?.id);
	}

	// Save password and remove forgot password tokens
	await userRepository.updateUser(user?.id, {
		password: hashedPassword,
		isVerified: true,
		isActive: true,
	});

	return {
		message: `Password ${setPassword ? 'set' : 'updated'} successfully. Please login to continue.`,
	};
};

const fetchProfile = async (req: RequestExtended) => {
	const { id } = req.user;
	const user = await userRepository.getActiveUserById(id);

	if (!user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}

	const data = {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		image: user.profileImg,
		roleId : user.roleId,
		roleName: user?.role?.roleName,
		permissions: user.role?.Permission,
	};

	return {
		data,
		message: 'User profile fetched successfully.',
	};
};

const updateProfile = async (req: RequestExtended) => {
	const data = {
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		// phone: req.body.phone || null,
	};
	if (invalidText(req.body.firstName)) {
		delete data['firstName'];
	}
	if (invalidText(req.body.lastName)) {
		delete data['lastName'];
	}

	const { id } = req.user;

	const user = await userRepository.getActiveUserById(id);

	if (!user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}

	const updatedUser = await userRepository.updateUser(id, data);

	return {
		user: {
			id: updatedUser.id,
			firstName: updatedUser.firstName,
			lastName: updatedUser.lastName,
		},
		message: 'User profile updated successfully.',
	};
};


export const authService = {
	loginService,
	forgotPassword,
	verifyForgotPassword,
	changePassword,
	fetchProfile,
	updateProfile,
	logoutService,
};
