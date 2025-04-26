/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestExtended } from '../interfaces/global';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { roleRepository } from '../repositories/roleRepository';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

const createRoleService = async (req: RequestExtended) => {
	const { roleName, roleDescription, isAdmin } = req.body;
	const { id } = req.user;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['add'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		roleName
	);
	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	} else {
		const role = await roleRepository.createRole(
			roleName,
			roleDescription,
			isAdmin,
			id
		);
		return {
			data: role,
			message: 'successfully create role.',
		};
	}
};

const getRoleService = async (req: RequestExtended) => {
	const { id, } = req.user;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['view'],
	});

	const { roles, total } = await roleRepository.getRoles();

	const data = roles?.map(
		({ id, roleName, roleDescription, status, companyId, isAdmin }: any) => ({
			id,
			roleName,
			roleDescription,
			status,
			companyId,
			isAdmin,
		})
	);
	return {
		data: data,
		total,
		message: 'Roles fetched successfully.',
	};
};

// const checkIfUserIsAdmin = async (userId: string, companyId: string) => {
// 	const userRole =
// 		await userCompanyRoleRepository.getUserRoleByUserIdAndCompanyId(
// 			userId,
// 			companyId
// 		);

// 	if (!userRole || !(userRole.isAdmin)) {
// 		throw new ApiException(ErrorCodes.UNAUTHORIZED);
// 	}

// 	return true;
// };

// const isAdmin = async (
// 	userId: string,
// 	companyId: string,
// 	isSuperAdmin: boolean
// ) => {
// 	const userRole =
// 		await userCompanyRoleRepository.getUserRoleByUserIdAndCompanyId(
// 			userId,
// 			companyId
// 		);

// 	if ((userRole && userRole.isAdmin) || isSuperAdmin) {
// 		return true;
// 	}
// 	return false;
// };


const getRoleOptionService = async (req: RequestExtended) => {
	const { roles, total } = await roleRepository.getRoles();

	const data = roles
		?.filter(
			(item: any) => !item.isAdmin
		)
		.map((item: any) => {
			return {
				id: item.id,
				roleName: item.roleName,
				roleDescription: item.roleDescription,
				status: item.status,
				companyId: item.companyId,
				isAdmin: item.isAdmin,
			};
		});

	return {
		data: data,
		total,
		message: 'Roles fetched successfully.',
	};
};


const deleteRoleService = async (req: RequestExtended) => {
	const { id, } = req.user;
	const { id: roleId } = req.params;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['delete'],
	});

	const role = await roleRepository.getRoleToDeleteById(roleId);
	
	if (!role) {
		throw new ApiException(ErrorCodes.ROLE_NOT_FOUND);
	}

	if (role?.users.length > 0) {
		throw new ApiException(ErrorCodes.CANNOT_DELETE_ROLE);
	}

	await roleRepository.deleteRoleById(roleId);

	return {
		message: 'Role deleted successfully.',
	};
};

const updateRoleService = async (req: RequestExtended) => {
	const { roleName, roleDescription, isAdmin, roleId } = req.body;
	const { id } = req.user;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['add'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		roleName
	);

	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	}

	const updateRole = await roleRepository.updateRoleById(
		roleName,
		roleDescription,
		isAdmin,
		id,
		roleId
	);
	return {
		data: updateRole,
		message: 'Role updated successfully.',
	};

};

const cloneRoleService = async (req: RequestExtended) => {
	const { roleName, roleDescription, isAdmin, cloneRoleId } = req.body;
	const { id } = req.user;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['add'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		roleName
	);
	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	}

	const isCloneRoleExists = await roleRepository.getRolePermissionById(
		cloneRoleId
	);
	if (!isCloneRoleExists) {
		throw new ApiException(ErrorCodes.ROLE_NOT_FOUND);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const filterData = isCloneRoleExists?.Permission.map(({ roleId,id, ...rest }) => rest);
	
	const role = await roleRepository.createCloneRole(
		roleName,
		roleDescription,
		isAdmin,
		id,
		filterData,
	);

	return {
		data: role,
		message: 'Role cloned successfully.',
	};

};


const updateRoleStatusService = async (req: RequestExtended) => {
	const { roleId, status } = req.body;
	const { id } = req.user;

	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['edit'],
	});

	const isRoleExists = await roleRepository.getRoleById(
		roleId
	);
	if (!isRoleExists) {
		throw new ApiException(ErrorCodes.ROLE_NOT_FOUND);
	}

	const x =await roleRepository.updateRoleStatusById(
		roleId,
		status,
		id
	);
	return {
		message: 'Role status updated successfully.',
	};
}

export const roleService = {
	createRoleService,
	getRoleService,
	// checkIfUserIsAdmin,
	// isAdmin,
	getRoleOptionService,
	deleteRoleService,
	updateRoleService,
	cloneRoleService,
	updateRoleStatusService
};
