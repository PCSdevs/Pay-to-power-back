/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-mixed-spaces-and-tabs */
import sendEmail from '../helpers/emailHelper';
import {
	generateVerificationToken,
	verifyVerificationToken,
} from '../helpers/tokenHelper';
import { RequestExtended } from '../interfaces/global';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { invitationsRepository } from '../repositories/invitationsRepository';
import { roleRepository } from '../repositories/roleRepository';
import { userRepository } from '../repositories/userRepository';
import { verifyUserTokenRepository } from '../repositories/verifyUserTokenRepository';
import { getInvitationEmailUserExistTemplate } from '../template/email/invitationEmailTemplate';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { invalidText } from '../utils/utils';

const inviteUserService = async (req: RequestExtended) => {
	const { email, role, fullName } = req.body;

	const { id } = req.user;


	const _email = email.toLowerCase();

	//check permission

	await checkPermission(id, {
		moduleName: 'Users',
		permission: ['add'],
	});
	const user = await userRepository.getAllUserByEmail(_email);

	if (user) {
		throw new ApiException(ErrorCodes.SAME_EMAIL);
	}

	// Check if role exists
	const isRoleExist = await roleRepository.getRoleById(role);
	if (!isRoleExist) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	const createdUser = await userRepository.createUser({
		email: _email,
		firstName: fullName ? fullName.split(' ')[0] : '',
		lastName: fullName ? fullName.split(' ')[1] : '',
		fullName: fullName,
		isVerified: false,
		isActive:false,
		createdBy: req.user.id,
		roleId: role
	});

	const inviteToken = await generateVerificationToken({
		email: _email,
		role: role,
	});

	//add invite token to db
	await verifyUserTokenRepository.addVerificationToken(
		inviteToken,
		createdUser.id
	);

	//check once again while run 

	await invitationsRepository.addInvitationToUser(
		req?.user?.id,
		createdUser.id,
		'Pending',
		inviteToken
	);

	const url = `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true?ispresent=false`;

	// Change Email Templete
	const emailContent = getInvitationEmailUserExistTemplate({
		email,
		url: url,
	});

	const mailOptions = {
		from: process.env.SMTP_EMAIL,
		to: email,
		subject: 'Invitation to join WageWorks',
		html: emailContent,
	};

	await userRepository.updateUser(createdUser.id, { isInvited: true });

	await sendEmail(mailOptions);


	return {
		message: 'Invite user successful',
	};
};

const verifyInvitationToken = async (req: RequestExtended) => {
	const { token,
		//  ispresent
	} = req.query;

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

	// if (ispresent) {
	// 	await invitationsRepository.updateInvitedUserStatusById(
	// 		verificationToken.id
	// 	);
	// 	// await userCompanyRoleRepository.updateUserCompanyRoleData(
	// 	// 	verified.id,
	// 	// 	verified.companyId,
	// 	// 	{ status: true }
	// 	// );

	// 	await userRepository.verifyUser(verified.id)

	// 	await tokenRepository.deleteVerifyTokenByUser(user?.id);
	// }
	// Accept in invitation also verify and active user

	return true;
};

const getUsersService = async (req: RequestExtended) => {
	const { page = 1, limit = 10, search, type, sort, filter } = req.query;
	const { id } = req.user;

	await userRepository.validateUser(id);

	//check permission

	await checkPermission(id, {
		moduleName: 'Users',
		permission: ['view'],
	});
	const offset = (Number(page) - 1) * Number(limit);

	// Conditions for search
	const searchCondition = {
		...(filter ? { isActive: filter === 'true' } : {}),
		...(search
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
			: {}),
	};

	// Conditions for sort
	const sortCondition = sort
		? {
			orderBy: {
				[sort as string]: type ?? 'asc',
			},
		}
		: {};

	const { users, total } = await userRepository.getUsers(
		offset,
		Number(limit),
		searchCondition,
		sortCondition
	);

	const _users = users.map((user: any) => {
		return {
			userId: user.id,
			name: user?.fullName,
			email: user?.email,
			status: user.isActive,
			roleId: user.role?.id,
			roleName: user.role?.roleName,
			isAdmin: user.role?.isAdmin,
			invitationStatus: user.invitedTo[0]?.invitationStatus ?? "Accepted",
			isVerified: user?.isVerified,
		};
	});

	return {
		data: _users,
		total: total,
		message: 'successfully fetched users.',
	};
};

const deleteUserService = async (deleteUserId: string, user: any) => {
	const { id } = user;
	await checkPermission(id, {
		moduleName: 'Users',
		permission: ['delete'],
	});

	const userData = await userRepository.getUserById(
		deleteUserId
	);

	if (userData?.id === id) {
		throw new ApiException(ErrorCodes.MISSING_PERMISSION);
	}
	
	const userToDeleteRole = await roleRepository.getRoleById(
		userData?.roleId as string
	);

	if (userToDeleteRole?.isAdmin) {
		throw new ApiException(ErrorCodes.CANNOT_DELETE_ADMIN);
	}
	await userRepository.deleteUser(deleteUserId);


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
	await checkPermission(user.id, {
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
			const role = await roleRepository.getRoleById(roleId)

			if (role) {
				await userRepository.updateUser(
					updateUserId,
					{ roleId }
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
	updateUserId: string;
}) => {
	const { status, user, updateUserId } = data;
	
	if (user?.id === updateUserId) {
		throw new ApiException(ErrorCodes.MISSING_PERMISSION);
	}

	await checkPermission(user.id, {
		moduleName: 'Users',
		permission: ['edit'],
	});
	await userRepository.validateUser(
		user.id
	);

	await userRepository.updateUser(
		updateUserId,
		{ isActive: status }
	);

	return {
		message: 'User status updated successfully',
	};
};

const reInviteUserService = async (data: any) => {
	const { user, reInviteUserId } = data;
	const { id } = user;


	await checkPermission(id, {
		moduleName: 'Users',
		permission: ['add'],
	});

	const _user = await userRepository.checkUserById(reInviteUserId);
	if (!_user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}

	const tokenDetails =
		await invitationsRepository.getInvitationTokenDetailsByUserId(
			reInviteUserId
		);
	if (tokenDetails?.invitationStatus !== 'Pending') {
		throw new ApiException(ErrorCodes.INVITATION_ALREADY_ACCEPTED);
	}

	const inviteToken = await generateVerificationToken({
		email: _user?.email,
		role: _user.roleId,
	});
	await invitationsRepository.updateInvitationTokenById(
		tokenDetails.id,
		inviteToken
	);


	const url = `${process.env.REACT_APP_BASE_URL}/set-password?token=${inviteToken}&first=true`

	// Change Email Templete
	const emailContent = getInvitationEmailUserExistTemplate({
		email: _user.email,
		url: url,
	});

	const mailOptions = {
		from: process.env.SMTP_EMAIL,
		to: _user.email,
		subject: 'Invitation to join Med-Panel',
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
