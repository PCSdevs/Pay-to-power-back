/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../client/prisma';
import { DefaultAdminPermissions, DefaultPermissions } from '../utils/data';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';


const getRoleToDeleteById = async (roleId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			id: roleId,
		},
		include: {
			users:true
		}
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

const validateRole = async (roleId: string) => {
	const role = await getRoleById(roleId);
	if (!role) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}
	return role
};

const getAdminRole = async () => {
	const role = await prisma.role.findFirst({
		where: {
			isAdmin: true,
			roleName: 'Admin',
		},
	});
	return role;
};

const getRoles = async () => {
	const roles = await prisma.role.findMany();

	const total = await prisma.role.count();

	return { roles, total };
};

const isSameRoleName = async (
	roleName: string,
	roleId = ''
) => {
	const isExistingRole = await prisma.role.findFirst({
		where: {
			id: {
				not: roleId,
			},
			roleName: {
				mode: 'insensitive',
				equals: roleName,
			}
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
	userId: string,
	isSystem?: boolean
) => {
	const role = await prisma.role.create({
		data: {
			roleName,
			roleDescription,
			isAdmin,
			isSystem,
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

// const checkCompanyAndRole = async (roleId: string, companyId: string) => {
// 	const isValid = await prisma.company.findFirst({
// 		where: {
// 			id: companyId,
// 			Role: {
// 				some: {
// 					id: roleId,
// 				},
// 			},
// 		},
// 	});

// 	return isValid;
// };

// const getRoleByCompany = async (data: {
// 	userId: string;
// 	companyId: string;
// }) => {
// 	const companyRole = await prisma.userCompanyRole.findFirst({
// 		where: {
// 			companyId: data.companyId,
// 			userId: data.userId,
// 		},
// 		include: {
// 			role: {
// 				include: {
// 					Permission: true,
// 				},
// 			},
// 		},
// 	});
// 	return companyRole ? companyRole.role : null;
// };

// const getAllSupervisors = async (companyId: string) => {
// 	const role = await prisma.role.findFirst({
// 		where: {
// 			companyId: companyId,
// 			isAdmin: false,
// 			roleName: 'Supervisor',
// 		},
// 	});

// 	const supervisors = await prisma.userCompanyRole.findMany({
// 		where: {
// 			roleId: role?.id,
// 			companyId: companyId,
// 		},
// 		include: {
// 			user: true,
// 		},
// 	});

// 	return supervisors;
// };

// const getRoleInCompany = async (companyId: string, userId: string) => {
// 	const role = await prisma.userCompanyRole.findFirst({
// 		where: {
// 			companyId: companyId,
// 			userId: userId,
// 		},
// 		include: {
// 			role: true,
// 		},
// 	});
// 	return role;
// };

const deleteRoleById = async (roleId: string) => {
	const role = await prisma.role.delete({
		where: {
			id: roleId,
		},
	});
	return role;
};

const updateRoleById = async (
	roleName: string,
	roleDescription: string,
	isAdmin: boolean = false,
	userId: string,
	roleId: string,
	isSystem?: boolean,
) => {
	const role = await prisma.role.update({
		where: {
			id : roleId
		},
		data: {
			roleName,
			roleDescription,
			isAdmin,
			isSystem,
			updatedBy: userId,
			Permission: {
				createMany: {
					data: isAdmin ? DefaultAdminPermissions : DefaultPermissions,
				},
			},
		},
	});

	return role;
};

const getRolePermissionById = async (roleId: string) => {
	const role = await prisma.role.findFirst({
		where: {
			id: roleId,
		},
		include: {
			Permission: true,
		},
	});
	return role;
}

const createCloneRole = async (
	roleName: string,
	roleDescription: string,
	isAdmin: boolean = false,
	userId: string,
	cloneRolePermissions: any,
	isSystem?: boolean,
) => {
	const role = await prisma.role.create({
		data: {
			roleName,
			roleDescription,
			isAdmin,
			isSystem,
			createdBy: userId,
			Permission: {
				createMany: {
					data: cloneRolePermissions,
				},
			},
		},
	});
	return role;
};

const updateRoleStatusById = async (roleId: string, status: boolean, userId: string) => {
	const role = await prisma.role.update({
		where: {
			id: roleId,
		},
		data: {
			status: status,
			updatedBy: userId
		},
	});
	return role;
};

export const roleRepository = {
	getRoleById,
	getAdminRole,
	getRoles,
	isSameRoleName,
	createRole,
	// checkCompanyAndRole,
	validateRole,
	getRoleToDeleteById,
	// getRoleByCompany,
	// getAllSupervisors,
	// getRoleInCompany,
	deleteRoleById,
	updateRoleById,
	getRolePermissionById,
	createCloneRole,
	updateRoleStatusById
};
