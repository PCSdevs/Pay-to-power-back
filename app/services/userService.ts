/* eslint-disable no-mixed-spaces-and-tabs */
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { userRepository } from '../repositories/userRepository';
import { roleRepository } from '../repositories/roleRepository';
import { userCompanyRoleRepository } from '../repositories/userCompanyRoleRepository';
import { companyRepository } from '../repositories/companyRepository';
import {
	generateVerificationToken,
	verifyVerificationToken,
} from '../helpers/tokenHelper';
import sendEmail from '../helpers/emailHelper';
import { RequestExtended } from '../interfaces/global';
import { verifyUserTokenRepository } from '../repositories/verifyUserTokenRepository';
import { invitationsRepository } from '../repositories/invitationsRepository';
import { invalidText } from '../utils/utils';
import { tokenRepository } from '../repositories/tokenRepository';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { getInvitationEmailUserExistTemplate } from '../template/email/invitationEmailTemplate';

const inviteUserService = async (req: RequestExtended) => {
	const { email, role, fullName } = req.body;

	const { companyId, id,isSuperAdmin,isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	const _email = email.toLowerCase();

	//check permission

	await checkPermission(id, companyId, {
		moduleName: 'Users',
		permission: ['add'],
	});
	const user = await userRepository.getAllUserByEmail(_email);

	// Check if role exists
	const isRoleExist = await roleRepository.getRole(role, companyId);
	if (!isRoleExist) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	if (user?.UserCompanyRole.length && !user.isDeleted) {
		const userExist =
			await userCompanyRoleRepository.getActiveUserByIdAndCompanyId(
				user?.id,
				companyId
			);

		if (userExist) {
			throw new ApiException(ErrorCodes.USER_ALREADY_EXISTS);
		}

		const company = await companyRepository.getCompanyById(companyId);

		const userCompanyRoleWithNullUserId =
			await userCompanyRoleRepository.getUserByRoleIdAndCompanyId(
				isRoleExist.id,
				companyId
			);

		let addedUser;
		if (
			// isRoleExist?.isAdmin &&
			!userCompanyRoleWithNullUserId?.userId &&
			userCompanyRoleWithNullUserId
		) {
			addedUser = await userCompanyRoleRepository.updateUserId(
				user.id,
				userCompanyRoleWithNullUserId?.id
			);
		} else {
			addedUser = await userCompanyRoleRepository.addUser(
				user.id,
				companyId,
				isRoleExist.id
			);
		}

		const inviteToken = generateVerificationToken({
			email: _email,
			role: role,
			company: company?.id,
		});

		//add invite token to db
		await verifyUserTokenRepository.addVerificationToken(inviteToken, user.id);

		await invitationsRepository.addInvitationToUser(
			req?.user?.id,
			user.id,
			addedUser.id,
			'Pending',
			inviteToken
		);

		const url = `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true&ispresent=true`;

		// Change Email Templete
		const emailContent = getInvitationEmailUserExistTemplate({
			email,
			companyName: company?.name,
			url: url,
		});

		const mailOptions = {
			from: process.env.SMTP_EMAIL,
			to: email,
			subject: 'Invitation to join Pay2Power',
			html: emailContent,
		};

		await sendEmail(mailOptions);
	} else {
		let createdUser;
		if (!user) {
			createdUser = await userRepository.createUser({
				email: _email,
				firstName: fullName ? fullName.split(' ')[0] : '',
				lastName: fullName ? fullName.split(' ')[1] : '',
				fullName: fullName,
				isVerified: false,
				createdBy: req.user.id,
				isSuperAdminCreated: isSuperAdmin || isSuperAdminCreated ? true : false
			});
		} else {
			await userRepository.updateUser(user.id, {
				isDeleted: false,
				firstName: fullName ? fullName.split(' ')[0] : '',
				lastName: fullName ? fullName.split(' ')[1] : '',
				fullName: fullName,
				isSuperAdminCreated: isSuperAdmin || isSuperAdminCreated ? true : false
			});
			createdUser = user;
		}
		const company = await companyRepository.getCompanyById(companyId);
		const userCompanyRoleWithNullUserId =
			await userCompanyRoleRepository.getUserByRoleIdAndCompanyId(
				isRoleExist.id,
				companyId
			);

		let addedUser;
		if (
			// isRoleExist?.isAdmin &&
			!userCompanyRoleWithNullUserId?.userId &&
			userCompanyRoleWithNullUserId
		) {
			addedUser = await userCompanyRoleRepository.updateUserId(
				createdUser.id,
				userCompanyRoleWithNullUserId?.id
			);
		} else {
			addedUser = await userCompanyRoleRepository.addUser(
				createdUser.id,
				companyId,
				isRoleExist.id
			);
		}

		const inviteToken = await generateVerificationToken({
			email: _email,
			role: role,
			company: company?.id,
		});

		//add invite token to db
		await verifyUserTokenRepository.addVerificationToken(
			inviteToken,
			createdUser.id
		);

		await invitationsRepository.addInvitationToUser(
			req?.user?.id,
			createdUser.id,
			addedUser.id,
			'Pending',
			inviteToken
		);

		const url = `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true?ispresent=false`;

		// Change Email Templete
		const emailContent = getInvitationEmailUserExistTemplate({
			email,
			companyName: company?.name,
			url: url,
		});

		const mailOptions = {
			from: process.env.SMTP_EMAIL,
			to: email,
			subject: 'Invitation to join Pay2Power',
			html: emailContent,
		};

		await userRepository.updateUser(createdUser.id, { isInvited: true });

		await sendEmail(mailOptions);
	}

	return {
		message: 'Invite user successful',
	};
};

const verifyInvitationToken = async (req: RequestExtended) => {
	const { token, ispresent } = req.query;

	if (!token) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const verified: any = verifyVerificationToken(token);
	if (!verified) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const user = await userRepository.getUserByEmail(verified?.email as string);

	// If user not exists, send error message
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	const verificationToken = await invitationsRepository.checkInvitationToken(
		token as string
	);

	if (!verificationToken) {
		throw new ApiException(ErrorCodes.INVALID_TOKEN);
	}

	if (ispresent) {
		await invitationsRepository.updateInvitedUserStatusById(
			verificationToken.id
		);
		await userCompanyRoleRepository.updateUserCompanyRoleData(
			verified.id,
			verified.companyId,
			{ status: true }
		);
		await tokenRepository.deleteVerifyTokenByUser(user?.id);
	}
	// // Accept in invitation also verify and active user
	// await invitationsRepository.updateInvitedUserStatusById(
	// 	verificationToken.id
	// );

	// await userRepository.updateUser(user?.id,{isVerified:true})

	return true;
};

const getUsersService = async (req: RequestExtended) => {
	const { page = 1, limit = 10, search, type, sort, filter } = req.query;
	const { companyId, id,isSuperAdmin,isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);
	await userRepository.validateUser(id);

	//check permission

	await checkPermission(id, companyId, {
		moduleName: 'Users',
		permission: ['view'],
	});
	const offset = (Number(page) - 1) * Number(limit);

	const filterConditions: Record<string, any> = {
		// ...(filter !== undefined && { status: filter === 'true' }),
		...(filter === 'true' || filter === 'false' ? { status: filter === 'true' } : {}),
		...((!isSuperAdmin || !isSuperAdminCreated) && { user :{isSuperAdminCreated: false }}),
	  };

	// Conditions for search
	const searchCondition = search
		? {
				OR: [
					{
						firstName: {
							mode: 'insensitive',
							contains: search as string,
						},
					},
					{
						lastName: {
							mode: 'insensitive',
							contains: search as string,
						},
					},
					{
						fullName: {
							mode: 'insensitive',
							contains: search as string,
						},
					},
					{
						email: { contains: search as string, mode: 'insensitive' },
					},
					{
						AND: [
							{
								firstName: {
									mode: 'insensitive',
									contains: String(search).split(' ')[0],
								},
							},
							{
								lastName: {
									mode: 'insensitive',
									contains: String(search).split(' ')[1],
								},
							},
						],
					},
				],
		  }
		: {};

	// Conditions for sort
	const sortCondition = sort
		? {
				orderBy: {
					[sort as string]: type ?? 'asc',
				},
		  }
		: {};

	const { users, total } = await userRepository.getUsersByCompanyId(
		companyId,
		offset,
		Number(limit),
		filterConditions,
		searchCondition,
		sortCondition
	);

	const _users = users.map((user) => {
		return {
			userCompanyRoleId: user.id,
			name: user.user?.fullName,
			email: user.user?.email,
			status: user.status,
			roleId: user.role.id,
			roleName: user.role.roleName,
			userId: user.userId,
			isAdmin: user.role.isAdmin,
			isSuperAdminCreated:user?.user?.isSuperAdminCreated,
			invitationStatus: user.Invitations[0]?.invitationStatus,
			isVerified: user.user?.isVerified,
		};
	});

	return {
		data: _users,
		total: total,
		message: 'successfully fetched users.',
	};
};

const deleteUserService = async (userCompanyRoleId: string, user: any) => {
	const { companyId, id, isSuperAdmin } = user;
	await checkPermission(id, companyId, {
		moduleName: 'Users',
		permission: ['delete'],
	});
	// const userCompanyRoleDetail =
	const userData = await userCompanyRoleRepository.getActiveUserById(
		userCompanyRoleId
	);
	if (userData.userId === id) {
		throw new ApiException(ErrorCodes.MISSING_PERMISSION);
	}
	const userToDeleteRoleInCompany = await roleRepository.getRoleById(
		userData?.roleId
	);

	if (userToDeleteRoleInCompany?.isAdmin && !isSuperAdmin) {
		throw new ApiException(ErrorCodes.CANNOT_DELETE_ADMIN);
	}
	await userCompanyRoleRepository.deleteUser(userCompanyRoleId);
	if (userData.userId) {
		const isUserPresentInotherCompany =
			await userCompanyRoleRepository.getUserCompanyRoleDataByUserId(
				userData.userId
			);
		if (!isUserPresentInotherCompany.length) {
			await userRepository.updateUser(userData.userId, {
				isDeleted: true,
				password: null,
				isVerified: false,
			});
		}
	}
	return {
		message: 'Successfully deleted user.',
	};
};

const updateUserService = async (data: {
	user: any;
	updateUserId: string;
	roleId: string;
	fullName: string;
}) => {
	const { user, updateUserId, roleId, fullName } = data;

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Users',
		permission: ['edit'],
	});

	const _user = await userRepository.getUserById(updateUserId);

	if (_user) {
		await userRepository.updateUser(_user.id, {
			fullName: fullName,
			firstName: fullName.split(' ')[0] ? fullName.split(' ')[0] : '',
			lastName: fullName.split(' ')[1] ? fullName.split(' ')[1] : '',
		});

		if (!invalidText(roleId)) {
			const companyRole = await userCompanyRoleRepository.getCompanyRole(
				updateUserId,
				user.companyId
			);

			if (companyRole) {
				await userCompanyRoleRepository.updateUserCompanyRole(
					updateUserId,
					user.companyId,
					roleId
				);
			}
		}
	}

	return {
		message: 'User updated successfully',
	};
};

const userStatusUpdateService = async (data: {
	user: any;
	status: boolean;
	updateUserCompanyRoleId: string;
}) => {
	const { status, updateUserCompanyRoleId, user } = data;

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Users',
		permission: ['edit'],
	});
	await userCompanyRoleRepository.validateUserCompanyRoleById(
		updateUserCompanyRoleId
	);

	await userCompanyRoleRepository.updateUserCompanyRoleById(
		updateUserCompanyRoleId,
		{ status: status }
	);

	return {
		message: 'User status updated successfully',
	};
};

const reInviteUserService = async (data: any) => {
	const { user, userCompanyRoleId } = data;
	const { companyId, id } = user;

	const validUser = await userCompanyRoleRepository.validateUserCompanyRoleById(
		userCompanyRoleId
	);
	await companyRepository.validateCompany(companyId);
	await checkPermission(id, companyId, {
		moduleName: 'Users',
		permission: ['add'],
	});
	if (!validUser.userId) {
		throw new ApiException(ErrorCodes.INVALID_USER_ID);
	}

	const _user = await userRepository.checkUserById(validUser.userId);
	if (!_user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}

	const tokenDetails =
		await invitationsRepository.getInvitationTokenDetailsByUserCompanyRoleId(
			userCompanyRoleId
		);
	if (tokenDetails?.invitationStatus !== 'Pending') {
		throw new ApiException(ErrorCodes.INVITATION_ALREADY_ACCEPTED);
	}

	const inviteToken = await generateVerificationToken({
		email: _user?.email,
		role: validUser.roleId,
		company: companyId,
	});
	const company = await companyRepository.getCompanyById(companyId);
	await invitationsRepository.updateInvitationTokenById(
		tokenDetails.id,
		inviteToken
	);

	// const userIncompany=await userCompanyRoleRepository.getUserCompanyRoleDataByUserId(_user.id)

	// const hasTrueStatus = userIncompany?.some(obj => obj.status === true);

	const url = _user.isVerified
		? `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true&ispresent=true`
		: `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true?ispresent=false`;

	// Change Email Templete
	const emailContent = getInvitationEmailUserExistTemplate({
		email: _user.email,
		companyName: company?.name,
		url: url,
	});

	const mailOptions = {
		from: process.env.SMTP_EMAIL,
		to: _user.email,
		subject: 'Invitation to join Pay2Power',
		html: emailContent,
	};

	await userRepository.updateUser(_user.id, { isInvited: true });

	await sendEmail(mailOptions);

	return {
		message: 'Invite user successful',
	};
};


export const userService = {
	inviteUserService,
	verifyInvitationToken,
	getUsersService,
	deleteUserService,
	updateUserService,
	userStatusUpdateService,
	reInviteUserService,
};
