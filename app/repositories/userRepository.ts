/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../client/prisma';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

const getActiveUserById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
			isActive: true,
			isVerified: true,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
		},

	});
	return user;
};


const getUserByEmail = async (email: string) => {
	const user = await prisma.user.findFirst({
		where: {
			email: email,
			isDeleted: false,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
			invitedBy: true,
		},

	});
	return user;
};

const updateUser = async (id: string, data: any) => {
	const user = await prisma.user.update({
		where: {
			id,
		},
		data,
	});
	return user;
};

const createUser = async (data: any) => {
	const user = await prisma.user.create({
		data,
	});
	return user;
};


const validateUser = async (userId: string) => {
	const user = await getActiveUserById(userId);
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_USER_ID);
	}
	return user
};

const getUserById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
		}
	});
	return user;
};

const checkUserById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
		},
	});
	return user;
};

const getAllUserByEmail = async (email: string) => {
	const user = await prisma.user.findFirst({
		where: {
			email: email,
		},
		include: {
			role: {
				include: {
					Permission: true,
				},
			},
			invitedTo: true,
		},
	});
	return user;
};

const verifyUser = async (email: string,) => {
	const user = await prisma.user.update({
		where: {
			email: email
		},
		data: {
			isVerified: true
		}
	});
	return user;
};

const getUsers = async (
	offset?: number,
	limit?: number,
	searchCondition?: any,
	sortCondition?: any
) => {
	const users = await prisma.user.findMany({
		where: {
			...searchCondition,
			isDeleted: false
		},
		orderBy: {
			...sortCondition.orderBy,
		},
		include: {
			role: {
				select: {
					id: true,
					roleName: true,
					isAdmin: true,
				},
			},
			invitedTo: {
				select: {
					invitationStatus: true,
				},
			},
		},
		skip: offset,
		take: limit,
	});

	const total = await prisma.user.count({
		where: { 
			...searchCondition,
			isDeleted: false
		}

	});

	return { users, total };
};
const deleteUser = async (userId: string) => {
	const user = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			isActive: false,
			isVerified: false,
			isDeleted: true,
			password: null,
			roleId: null
		}

	});
	return user;
};

const getUserRoleStatusById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
			isActive: true,
			isVerified: true,
		},
		select: {
			role: {
				select: {
					status: true,
				},
			},
		},
	});

	return user?.role?.status ?? null;
};



export const userRepository = {
	getActiveUserById,
	getUserByEmail,
	updateUser,
	createUser,
	validateUser,
	getUserById,
	getAllUserByEmail,
	checkUserById,
	verifyUser,
	getUsers,
	deleteUser,
	getUserRoleStatusById
};
