import { Role, User } from '@prisma/client';
import { prisma } from '../../client/prisma';
import { hashPassword } from '../../helpers/passwordHelper';

export async function up() {
	let role: Role | null = null;
	let user: User | null = null;

	const adminRole = await prisma.role.findFirst({
		where: {
			roleName: 'SUPER_ADMIN',
			isSuperAdmin: true,
		},
	});

	if (!adminRole) {
		role = await prisma.role.create({
			data: {
				roleName: 'SUPER_ADMIN',
				isSuperAdmin: true,
			},
		});
	}

	const adminUser = await prisma.user.findFirst({
		where: {
			email: process.env.ADMIN_EMAIL || 'pratikp@serviots.com',
		},
	});

	if (!adminUser) {
		user = await prisma.user.create({
			data: {
				email: process.env.ADMIN_EMAIL || 'pratikp@serviots.com',
				isVerified: true,
				isActive: true,
				// isSuperAdminCreated:true,
				password: await hashPassword(
					process.env.ADMIN_PASSWORD || 'SuperAdmin1213#'
				),
			},
		});
	}

	if (user && role) {
		await prisma.userCompanyRole.create({
			data: {
				userId: user.id,
				roleId: role.id,
				isSuperAdminCreated:true,
			},
		});
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down() {
	// do nothing
}
