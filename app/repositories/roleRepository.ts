import { prisma } from '../client/prisma';
import { DefaultAdminPermissions, DefaultPermissions } from '../utils/data';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

const getSuperAdminRole = async () => {
	const role = await prisma.role.findFirst({
		where: {
			isSuperAdmin: true,
		},
	});
	return role;
};

const getSuperUserByUserId = async (userId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			isSuperAdmin: true,
		},
	});

	if (role) {
		const companyRole = await prisma.userCompanyRole.findFirst({
			where: {
				roleId: role.id,
				userId: userId,
			},
			include: {
				user: true,
				role: true,
				company: true,
			},
		});
		return companyRole;
	}
	return null;
};

const getRole = async (roleId: string, companyId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			id: roleId,
			companyId: companyId,
		},
	});
	return role;
};

const getRoleById = async (id: string) => {
	const role = await prisma.role.findFirst({
		where: {
			id,
		},
	});
	return role;
};

const validateRole = async (companyId: string) => {
	const role = await getRoleById(companyId);
	if (!role) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}
};

const getAdminRole = async (companyId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			companyId: companyId,
			isAdmin: true,
			roleName: 'Admin',
		},
	});
	return role;
};

const getRoleByCompanyId = async (id: string, needSuperAdminCreated?: boolean) => {
	const roles = await prisma.role.findMany({
		where: {
			companyId: id,
			...(needSuperAdminCreated ? {} : {
				isSuperAdminCreated: false
			})
		},
	});

	const total = await prisma.role.count({
		where: {
			companyId: id,
			...(needSuperAdminCreated ? {} : {
				isSuperAdminCreated: false
			})
		},
	});

	return { roles, total };
};

const isSameRoleName = async (
	companyId: string,
	roleName: string,
	roleId: string = ''
) => {
	const isExistingRole = await prisma.role.findFirst({
		where: {
			id: {
				not: roleId,
			},
			roleName: {
				mode: 'insensitive',
				equals: roleName,
			},
			UserCompanyRole: {
				some: {
					company: {
						id: companyId,
					},
				},
			},
		},
	});

	if (isExistingRole) {
		return true;
	} else {
		return false;
	}
};

const createRole = async (
	roleName: string,
	roleDescription: string,
	isAdmin: boolean = false,
	companyId: string,
	userId: string,
	isSuperAdminCreated: boolean,
	isSystem?: boolean,
) => {
	const role = await prisma.role.create({
		data: {
			roleName,
			roleDescription,
			isAdmin,
			isSystem,
			isSuperAdminCreated,
			isSuperAdmin: false,
			companyId: companyId,
			createdBy: userId,
			Permission: {
				createMany: {
					data: isAdmin ? DefaultAdminPermissions : DefaultPermissions,
				},
			},
		},
	});

	return role;
};

const checkCompanyAndRole = async (roleId: string, companyId: string) => {
	const isValid = await prisma.company.findFirst({
		where: {
			id: companyId,
			Role: {
				some: {
					id: roleId,
				},
			},
		},
	});

	return isValid;
};

const getRoleByCompany = async (data: {
	userId: string;
	companyId: string;
}) => {
	const companyRole = await prisma.userCompanyRole.findFirst({
		where: {
			companyId: data.companyId,
			userId: data.userId,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
		},
	});
	return companyRole ? companyRole.role : null;
};

const getAllSupervisors = async (companyId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			companyId: companyId,
			isAdmin: false,
			roleName: 'Supervisor',
		},
	});

	const supervisors = await prisma.userCompanyRole.findMany({
		where: {
			roleId: role?.id,
			companyId: companyId,
		},
		include: {
			user: true,
		},
	});

	return supervisors;
};

const getRoleInCompany = async (companyId: string, userId: string) => {
	const role = await prisma.userCompanyRole.findFirst({
		where: {
			companyId: companyId,
			userId: userId,
		},
		include: {
			role: true,
		},
	});
	return role;
};

const updateRole = async (
	roleName: string,
	roleDescription: string,
	companyId: string,
	roleId:string
) => {
	const role = await prisma.role.update({
		where:{
			id:roleId,
			companyId:companyId
		},
		data: {
			roleName,
			roleDescription
		},
	});

	return role;
};

export const roleRepository = {
	getSuperAdminRole,
	getRoleById,
	getAdminRole,
	getRoleByCompanyId,
	isSameRoleName,
	createRole,
	checkCompanyAndRole,
	validateRole,
	getRole,
	getRoleByCompany,
	getSuperUserByUserId,
	getAllSupervisors,
	getRoleInCompany,
	updateRole
};
