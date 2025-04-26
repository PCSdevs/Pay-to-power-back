/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../client/prisma';
import { userRepository } from '../repositories/userRepository';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

export const checkPermission = async (
	userId: string,
	requiredPermission: any
) => {
	const _user = await userRepository.getActiveUserById(userId);

	if (_user?.role?.isAdmin) {
		return;
	}
	
	const userPermissions: any = await prisma.user.findFirst({
		where: {
			id: userId,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
		},
	});

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
