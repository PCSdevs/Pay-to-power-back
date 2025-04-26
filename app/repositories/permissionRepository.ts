import { prisma } from '../client/prisma';

const updatePermission = async (permission: any, roleId: string) => {
	permission.forEach(async (singlePermission: any) => {
		const permissionObjCopy = { ...singlePermission };

		if (permissionObjCopy.all === true) {
			permissionObjCopy.delete = true;
			permissionObjCopy.edit = true;
			permissionObjCopy.view = true;
			permissionObjCopy.add = true;
			permissionObjCopy.approval = true;
		}
		if (permissionObjCopy.edit === true) {
			permissionObjCopy.view = true;
		}
		if (permissionObjCopy.delete === true) {
			permissionObjCopy.view = true;
		}
		if (permissionObjCopy.add === true) {
			permissionObjCopy.view = true;
		}

		await prisma.permission.updateMany({
			where: {
				id: permissionObjCopy.id,
				roleId: roleId,
			},
			data: {
				all: permissionObjCopy.all,
				delete: permissionObjCopy.delete,
				edit: permissionObjCopy.edit,
				view: permissionObjCopy.view,
				add: permissionObjCopy.add,
				approval: permissionObjCopy.approval,
			},
		});
	});
};

const getPermissionById = async (roleId: string) => {
	const permissions = await prisma.permission.findMany({
		where: {
			roleId: roleId,
		},
		orderBy: {
			sortId: 'asc',
		},
	});
	return permissions;
};
const findAllApproveModulePermission = async (data: { roleId?: string }) => {
	const permissions = await prisma.permission.findMany({
		where: {
			roleId: data.roleId,
			approval: true,
		},
		select: {
			moduleName: true,
		},
	});
	return permissions;
};

export const permissionRepository = {
	updatePermission,
	getPermissionById,
	findAllApproveModulePermission,
};
