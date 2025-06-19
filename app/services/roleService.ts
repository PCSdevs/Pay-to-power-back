import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { roleRepository } from '../repositories/roleRepository';
import { userCompanyRoleRepository } from '../repositories/userCompanyRoleRepository';
import { RequestExtended } from '../interfaces/global';
import { companyRepository } from '../repositories/companyRepository';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { permission } from 'process';

const createRoleService = async (req: RequestExtended) => {
	const { roleName, roleDescription, isAdmin } = req.body;
	const { companyId, id, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	//Check permission
	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['add'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		companyId,
		roleName
	);
	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	} else {
		const role = await roleRepository.createRole(
			roleName,
			roleDescription,
			isAdmin,
			companyId,
			id,
			(isSuperAdminCreated || isSuperAdmin) ? true : false

		);
		await userCompanyRoleRepository.combineRoleCompany(companyId, role.id);
		const data = {
			id: role.id,
			roleName: role.roleName,
			roleDescription: role.roleDescription,
			status: role.status,
			companyId: role.companyId,
		};
		return {
			data,
			message: 'successfully create role.',
		};
	}
};

const getRoleService = async (req: RequestExtended) => {
	const { id, companyId, isSuperAdmin, isSuperAdminCreated } = req.user;

	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['view'],
	});

	await companyRepository.validateCompany(companyId);

	const { roles, total } = await roleRepository.getRoleByCompanyId(companyId, (isSuperAdminCreated || isSuperAdmin) ? true : false);

	const data = roles?.map(
		({ id, roleName, roleDescription, status, companyId, isAdmin }) => ({
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

const checkIfUserIsAdmin = async (userId: string, companyId: string) => {
	const userRole =
		await userCompanyRoleRepository.getUserRoleByUserIdAndCompanyId(
			userId,
			companyId
		);

	if (!userRole || !(userRole.isAdmin || userRole.isSuperAdmin)) {
		throw new ApiException(ErrorCodes.UNAUTHORIZED);
	}

	return true;
};

const isAdmin = async (
	userId: string,
	companyId: string,
	isSuperAdmin: boolean
) => {
	const userRole =
		await userCompanyRoleRepository.getUserRoleByUserIdAndCompanyId(
			userId,
			companyId
		);

	if ((userRole && userRole.isAdmin) || isSuperAdmin) {
		return true;
	}
	return false;
};

const updateRoleService = async (req: RequestExtended) => {
	const { roleName, roleDescription, roleId } = req.body;
	const { companyId, id, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	//Check permission
	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['edit'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		companyId,
		roleName,
		roleId
	);
	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	} else {
		const role = await roleRepository.updateRole(
			roleName,
			roleDescription,
			companyId,
			roleId
		);
		const data = {
			id: role.id,
			roleName: role.roleName,
			roleDescription: role.roleDescription,
			status: role.status,
			companyId: role.companyId,
		};
		return {
			data,
			message: 'successfully updated role.',
		};
	}
};

const getRoleOptionService = async (req: RequestExtended) => {
	const { companyId, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	const { roles, total } = await roleRepository.getRoleByCompanyId(companyId, (isSuperAdminCreated || isSuperAdmin) ? true : false);

	const data = roles
		?.filter(
			(item) => item.roleName !== 'Super Admin' && item.roleName !== 'Admin'
		)
		.map((item) => {
			return {
				id: item.id,
				roleName: item.roleName,
				roleDescription: item.roleDescription,
				status: item.status,
				companyId: item.companyId,
				isAdmin: item.isAdmin,
				isSuperAdminCreated: item.isSuperAdminCreated
			};
		});

	return {
		data: data,
		// total,
		message: 'Roles options fetched successfully.',
	};
};

const deleteRoleService = async (req: RequestExtended) => {
	const { roleId } = req.body;
	const { companyId, id, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	//Check permission
	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['delete'],
	});

	const isRoleExist = await roleRepository.getRoleById(roleId)

	if (!isRoleExist || isRoleExist?.isSuperAdmin) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	if (!isSuperAdminCreated && !isSuperAdmin && isRoleExist?.isSuperAdminCreated) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	const { users, count } = await userCompanyRoleRepository?.getAllUsersByRole({ companyId, roleId })

	if (users.length > 0) {
		throw new ApiException(ErrorCodes.CANNOT_DELETE_ROLE)
	}

	await roleRepository?.deleteRole(roleId, companyId)

	return {
		message: 'Roles deleted successfully.',
	}

};

const cloneRoleService = async (req: RequestExtended) => {
	const { cloneRoleId, roleName, roleDescription, isAdmin = false } = req.body;
	const { companyId, id, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	//Check permission
	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['add'],
	});

	const isRoleNameExists = await roleRepository.isSameRoleName(
		companyId,
		roleName
	);

	const targetRole = await roleRepository.getRoleById(cloneRoleId)

	if (!targetRole || targetRole?.isSuperAdmin) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}
	if (!isSuperAdminCreated && !isSuperAdmin && targetRole?.isSuperAdminCreated) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	if (isRoleNameExists) {
		throw new ApiException(ErrorCodes.ROLE_ALREADY_EXISTS);
	} else {
		const role = await roleRepository.cloneRole(
			roleName,
			roleDescription,
			isAdmin,
			companyId,
			id,
			isSuperAdminCreated || isSuperAdmin,
			false,
			targetRole?.Permission
		);
		await userCompanyRoleRepository.combineRoleCompany(companyId, role.id);
		const data = {
			id: role.id,
			roleName: role.roleName,
			roleDescription: role.roleDescription,
			status: role.status,
			companyId: role.companyId,
		};
		return {
			data,
			message: 'successfully clone role.',
		};
	}

};

const roleStatusUpdateService = async (req: RequestExtended) => {
	const { roleId, status } = req.body;
	const { companyId, id, isSuperAdmin, isSuperAdminCreated } = req.user;

	await companyRepository.validateCompany(companyId);

	//Check permission
	await checkPermission(id, companyId, {
		moduleName: 'Roles',
		permission: ['delete'],
	});

	const isRoleExist = await roleRepository.getRoleById(roleId)

	if (!isRoleExist || isRoleExist?.isSuperAdmin) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}

	if (!isSuperAdminCreated && !isSuperAdmin && isRoleExist?.isSuperAdminCreated) {
		throw new ApiException(ErrorCodes.INVALID_ROLE_ID);
	}


	await roleRepository?.updateRoleStatus({roleId, companyId, status})

	return {
		message: 'Role status updated successfully.',
	}

};

export const roleService = {
	createRoleService,
	getRoleService,
	checkIfUserIsAdmin,
	isAdmin,
	getRoleOptionService,
	updateRoleService,
	deleteRoleService,
	cloneRoleService,
	roleStatusUpdateService
};
