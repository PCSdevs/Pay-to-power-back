import { Role, User } from '@prisma/client';
import { prisma } from '../../client/prisma';
import { hashPassword } from '../../helpers/passwordHelper';
import { DefaultAdminPermissions } from '../../utils/data';

export async function up() {
	let role: Role | null = null;
	let user: User | null = null;

	role = await prisma.role.findFirst({
		where: {
			roleName: 'Admin',
			isAdmin: true,
		},
	});

	if (!role) {
		role = await prisma.role.create({
			data: {
				roleName: 'Admin',
				isAdmin: true,
				Permission: {
					createMany: {
						data:DefaultAdminPermissions ,
					},
				},
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
				email: process.env.ADMIN_EMAIL || "pratikp@serviots.com",
				password: await hashPassword("Admin@123"),
				isVerified: true,
				isActive: true,
				isDeleted: false,
				roleId: role?.id

			}
		});
	}

}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down() {
	// do nothing
}
