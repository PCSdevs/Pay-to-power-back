import { prisma } from '../../client/prisma';
import { userRepository } from '../../repositories/userRepository';
import {
	DefaultAdminPermissions,
	DefaultPermissions,
	defaultCompanies,
} from '../../utils/data';

export async function up() {
	const superuser = await userRepository.getSuperUser();

	defaultCompanies?.forEach(async (company) => {
		const createdCompany = await prisma.company.create({
			data: { ...company, createdBy: superuser },
		});

		const adminRole = await prisma.role.create({
			data: {
				roleName: 'Admin',
				roleDescription: 'All company permissions granted',
				isSystem: true,
				isSuperAdmin: false,
				isAdmin: true,
				status: true,
				companyId: createdCompany.id,
			},
		});

		await prisma.userCompanyRole.create({
			data: {
				companyId: createdCompany?.id,
				roleId: adminRole?.id,
			},
		});

		const permissions = DefaultAdminPermissions?.map((permission) => {
			return {
				...permission,
				roleId: adminRole.id,
			};
		});
		await prisma.permission.createMany({
			data: permissions.length > 0 ? permissions : [],
		});

		// for (const role of defaultRoles) {
		// 	const _role = await prisma.role.create({
		// 		data: {
		// 			roleName: role.roleName,
		// 			roleDescription: role.roleDescription,
		// 			isSystem: true,
		// 			isSuperAdmin: false,
		// 			isAdmin: false,
		// 			status: true,
		// 			companyId: createdCompany.id,
		// 		},
		// 	});

		// 	await prisma.userCompanyRole.create({
		// 		data: {
		// 			companyId: createdCompany?.id,
		// 			roleId: _role?.id,
		// 		},
		// 	});

		// 	const _permissions = DefaultPermissions?.map((permission) => {
		// 		return {
		// 			...permission,
		// 			roleId: _role.id,
		// 		};
		// 	});
		// 	await prisma.permission.createMany({
		// 		data: _permissions.length > 0 ? _permissions : [],
		// 	});
		// }
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down() {
	// do nothing
}
