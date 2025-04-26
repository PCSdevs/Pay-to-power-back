import { RequestExtended } from '../interfaces/global';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { permissionRepository } from '../repositories/permissionRepository';
import { roleRepository } from '../repositories/roleRepository';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

const updatePermissionService = async (req: RequestExtended) => {
	const { permissions, roleId } = req.body;
	const { id } = req.user;

	//Check permisssion
	await checkPermission(id, {
		moduleName: 'Roles',
		permission: ['edit'],
	});

	const role = await roleRepository.getRoleById(roleId);
	await roleRepository.validateRole(roleId);
	if (role) {
		if (!role.isAdmin) {
			await permissionRepository.updatePermission(permissions, roleId);
			return {
				message: 'Permissions successfully updated.',
			};

		} else {
			throw new ApiException(ErrorCodes.MISSING_PERMISSION);
		}
	} else {
		throw new ApiException(ErrorCodes.ROLE_NOT_FOUND);
	}
};

const getPermissionsByRoleIdService = async (req: RequestExtended) => {
	const { id } = req.params;
	const { id: userId } = req.user

	//Check permisssion
	await checkPermission(userId, {
		moduleName: 'Roles',
		permission: ['view'],
	});
	await roleRepository.validateRole(id);
	const _permissions = await permissionRepository.getPermissionById(id);

	// const permissions = disablePermissions(_permissions);
	return { data: _permissions, message: 'Successfully fetch permissions' };
};

export const permissionService = {
	updatePermissionService,
	getPermissionsByRoleIdService,
};
