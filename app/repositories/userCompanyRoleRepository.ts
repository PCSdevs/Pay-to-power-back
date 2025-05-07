import { prisma } from '../client/prisma';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

const getActiveUserByIdAndCompanyId = async (id: string, companyId: string) => {
	const role = await prisma.userCompanyRole.findFirst({
		where: {
			userId: id,
			companyId: companyId,
		},
	});
	return role;
};

const getUserByRoleIdAndCompanyId = async (
	roleId: string,
	companyId: string
) => {
	const user = await prisma.userCompanyRole.findFirst({
		where: {
			roleId: roleId,
			companyId: companyId,
		},
	});
	return user;
};

const getUserRoleByUserIdAndCompanyId = async (
	userId: string,
	companyId: string
) => {
	const userRole = await prisma.userCompanyRole.findFirst({
		where: {
			userId: userId,
			companyId: companyId,
		},
		include: {
			role: true,
		},
	});
	return userRole?.role;
};

const addUser = async (userId: string, companyId: string, roleId: string) => {
	const user = await prisma.userCompanyRole.create({
		data: {
			userId: userId,
			companyId: companyId,
			roleId: roleId,
			status: false,
		},
	});
	return user;
};

const updateUserId = async (userId: string, id: string) => {
	const user = await prisma.userCompanyRole.update({
		where: { id: id },
		data: { userId: userId },
	});
	return user;
};

const combineRoleCompany = async (companyId: string, roleId: string) => {
	const user = await prisma.userCompanyRole.create({
		data: {
			company: { connect: { id: companyId } },
			role: { connect: { id: roleId } },
		},
	});
	return user;
};

const deleteUser = async (userCompanyRoleId: string) => {
	const user = await prisma.userCompanyRole.deleteMany({
		where: {
			id: userCompanyRoleId,
		},
	});
	return user;
};

const getActiveUserById = async (id: string) => {
	const user = await prisma.userCompanyRole.findFirst({
		where: {
			id: id,
		},
	});
	if (!user) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND);
	}
	return user;
};

const updateUserCompanyRole = async (
	userId: string,
	companyId: string,
	roleId: string
) => {
	await prisma.userCompanyRole.updateMany({
		where: {
			userId: userId,
			companyId: companyId,
		},
		data: {
			roleId: roleId,
		},
	});
};

const getCompanyRole = async (userId: string, companyId: string) => {
	const userRole = await prisma.userCompanyRole.findFirst({
		where: {
			userId: userId,
			companyId: companyId,
		},
	});
	return userRole;
};

const validateUserCompanyRoleById = async (usercomapnyroleId: string) => {
	const userCompanyRole = await prisma.userCompanyRole.findFirst({
		where: { id: usercomapnyroleId },
	});

	if (!userCompanyRole) {
		throw new ApiException(ErrorCodes.INVALID_USER_COMPANY_ROLE_ID);
	}
	return userCompanyRole;
};

const updateUserCompanyRoleById = async (
	usercomapnyroleId: string,
	data: any
) => {
	const userCompanyRole = await prisma.userCompanyRole.update({
		where: { id: usercomapnyroleId },
		data: data,
	});

	return userCompanyRole;
};

const updateUserCompanyRoleData = async (
	userId: string,
	companyId: string,
	data: any
) => {
	await prisma.userCompanyRole.updateMany({
		where: {
			userId: userId,
			companyId: companyId,
		},
		data: data,
	});
};

const getUserCompanyRoleDataByUserId = async (userId: string) => {
	const users = await prisma.userCompanyRole.findMany({
		where: {
			userId: userId,
		},
	});
	return users;
};

const addUserByCompanyIdAndRoleId = async (
	companyId: string,
	roleId: string
) => {
	const users = await prisma.userCompanyRole.create({
		data: {
			companyId: companyId,
			roleId: roleId,
		},
	});
	return users;
};

const getAllUsersByRole = async (data: {
	companyId: string;
	roleId: string;
}) => {
	const supervisors = await prisma.userCompanyRole.findMany({
		where: {
			companyId: data.companyId,
			roleId: data.roleId,
			status: true,
		},
		include: {
			user: true,
		},
	});

	const count = await prisma.userCompanyRole.count({
		where: {
			companyId: data.companyId,
			roleId: data.roleId,
			status: true,
		},
	});

	return { supervisors, count };
};

export const userCompanyRoleRepository = {
	getUserByRoleIdAndCompanyId,
	getActiveUserByIdAndCompanyId,
	addUser,
	updateUserId,
	combineRoleCompany,
	deleteUser,
	getActiveUserById,
	updateUserCompanyRole,
	getCompanyRole,
	validateUserCompanyRoleById,
	updateUserCompanyRoleById,
	updateUserCompanyRoleData,
	getUserCompanyRoleDataByUserId,
	addUserByCompanyIdAndRoleId,
	getUserRoleByUserIdAndCompanyId,
	getAllUsersByRole,
};
