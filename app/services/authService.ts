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
import { disablePermissions, invalidText } from '../utils/utils';
import { companyRepository } from '../repositories/companyRepository';
import { DefaultAdminPermissions } from '../utils/data';
import { userCompanyRoleRepository } from '../repositories/userCompanyRoleRepository';
import { roleRepository } from '../repositories/roleRepository';

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

	let companies: any = [];
	// let permissions: any = [];
	let isSuperAdmin = false;
	let isAdmin=false;

	if (user.UserCompanyRole.length > 0) {
		const companyRole = user.UserCompanyRole.find(
			(companyRole) => companyRole.companyId === null
		);

		if (companyRole) {
			companies = await companyRepository.getAllCompanies();
			isSuperAdmin = companyRole.role.isSuperAdmin;
			isAdmin=companyRole.role.isAdmin;
		} else {
			companies = [user.UserCompanyRole[0].company];
			// permissions = user.UserCompanyRole[0].role.Permission;
			isSuperAdmin = user.UserCompanyRole[0].role.isSuperAdmin;
			isAdmin=user.UserCompanyRole[0].role.isAdmin;
		}
	}

	const isValidForLogin = user.UserCompanyRole.some(
		(user) => user.status == true
	);

	if (!isValidForLogin) {
		throw new ApiException(ErrorCodes.NOT_ACTIVE);
	}

	if (accessToken) {
		await tokenRepository.deleteAccessTokenByUser(user.id);
		const newAccessToken = generateAccessToken({
			id: user.id,
			isSuperAdminCreated:user?.isSuperAdminCreated,
			email,
			companyId: companies.length > 0 ? companies[0].id : null,
			isSuperAdmin,
			isAdmin,
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
			companyId: companies.length > 0 ? companies[0].id : null,
			isSuperAdmin,
			isAdmin,
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
		subject: 'Reset Password - Pay2Power',
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
			await userCompanyRoleRepository.updateUserCompanyRoleData(
				verified.id,
				verified.companyId,
				{ status: true }
			);

			// const tokenExist = await tokenRepository.getVerifyTokenByUser(
			// 	verified.id
			// );
			// if (!tokenExist) {
			// 	throw new ApiException(ErrorCodes.INVALID_TOKEN);
			// }
		} else {
			verified = await verifyForgotPasswordToken(token);
			if (!verified) {
				throw new ApiException(ErrorCodes.INVALID_TOKEN);
			}
			const tokenExist = await tokenRepository.getForgotPasswordTokenByUser(
				verified.id
			);
			if (!tokenExist) {
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
		message: `Password ${setPassword ? 'set' :'updated'} successfully. Please login to continue.`,
	};
};

const fetchProfile = async (req: RequestExtended) => {
	const { id } = req.user;
	const user = await userRepository.getActiveUserById(id);

	if (!user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}

	let companies: any = [];
	let permissions = [];

	if (user.UserCompanyRole.length > 0) {
		const companyRole = user.UserCompanyRole.find(
			(companyRole) => companyRole.companyId === null
		);

		if (companyRole) {
			companies = await companyRepository.getAllCompanies();
			permissions = DefaultAdminPermissions;
		} else {
			companies = user.UserCompanyRole.map((item: any) => {
				return {
					id: item.companyId,
					name: item.company?.name,
					roleId: item.roleId,
					roleName : item?.role?.roleName,
					permissions: item.role.Permission,
				};
			});

			const companyRole = companies.find(
				(company: any) => company.id === req.user.companyId
			);

			permissions = companyRole.permissions;
		}
	}

	const _permissions = disablePermissions(permissions);
	const data = {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		image: user.profileImg,
		companies: companies,
		 roleName : user.UserCompanyRole[0].role.roleName,
		permissions: _permissions,
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

const changeCompany = async (req: RequestExtended) => {
	const companyId = req.body.companyId;
	const accessToken = await tokenRepository.getAccessTokenByUser(req.user.id);
	let isSuperAdmin = false;

	const userRole = await roleRepository.getRoleByCompany({
		companyId: companyId,
		userId: req.user.id,
	});

	if (!userRole) {
		const isSuperUser = await roleRepository.getSuperUserByUserId(req.user.id);
		if (isSuperUser) {
			isSuperAdmin = true;
		}
	}

	if (accessToken) {
		await prisma.user.update({
			where: {
				id: req.user.id,
			},
			data: {
				lastLogin: new Date(),
			},
		});
		await tokenRepository.deleteAccessTokenByUser(req.user.id);
		const newAccessToken = generateAccessToken({
			id: req.user.id,
			email: req.user.email,
			companyId: companyId,
			isAdmin: userRole?.isAdmin,
			// permissions: isSuperAdmin
			// 	? disablePermissions(DefaultAdminPermissions)
			// 	: disablePermissions(userRole?.Permission),
			isSuperAdmin: isSuperAdmin
				? true
				: userRole
				? userRole?.isSuperAdmin
				: false,
		});
		await tokenRepository.createAccessTokenByUser(req.user.id, newAccessToken);
		return {
			accessToken: newAccessToken,
			message: 'Company changed successfully',
		};
	}
};

export const authService = {
	loginService,
	forgotPassword,
	verifyForgotPassword,
	changePassword,
	fetchProfile,
	updateProfile,
	logoutService,
	changeCompany
};
