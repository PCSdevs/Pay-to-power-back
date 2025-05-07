import { prisma } from '../client/prisma';
import { userRepository } from '../repositories/userRepository';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
// Assuming you have the necessary imports and setup for Prisma and Express

export const checkPermission = async (
	userId: string,
	companyId: string,
	requiredPermission: any
) => {
	const _user = await userRepository.getActiveUserById(userId);

		if (_user?.UserCompanyRole[0].role.isSuperAdmin) {
		return;
	}
	const userPermissions: any = await prisma.userCompanyRole.findFirst({
		where: {
			userId: userId,
			companyId,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
		},
	});
	
	if (userPermissions.role.isSuperAdmin) {
		return;
	}
	
	const permissionsList = userPermissions.role.Permission;
	const permission = permissionsList.find(
		(singlePermission: any) =>
			singlePermission.moduleName === requiredPermission.moduleName
	);
	if (permission) {
		const permitted = requiredPermission.permission.some(
			(singlePermission: string) => permission[singlePermission]
		);
		if (!permitted) {
			throw new ApiException(ErrorCodes.MISSING_PERMISSION);
		}
		return permitted || permission['all'];
	} else {
		throw new ApiException(ErrorCodes.MISSING_PERMISSION);
	}
};
