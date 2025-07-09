import { prisma } from '../client/prisma';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { roleRepository } from './roleRepository';

const getActiveUserById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
			isActive: true,
			isVerified: true,
			UserCompanyRole: {
				some: {
					status: true,
				},
			},
		},
		include: {
			UserCompanyRole: {
				include: {
					company: true,
					role: {
						include: {
							Permission: true,
						},
					},
					Invitations: true,
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
			UserCompanyRole: {
				include: {
					company: true,
					role: {
						include: {
							Permission: true,
						},
					},
					Invitations: true,
				},
			},
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

const getSuperUser = async () => {
	const superUserRole = await roleRepository.getSuperAdminRole();

	if (superUserRole) {
		const companyRole = await prisma.userCompanyRole.findFirst({
			where: {
				roleId: superUserRole.id,
			},
		});
		return companyRole?.userId;
	}

	return null;
};

const validateUser = async (userId: string) => {
	const user = await getActiveUserById(userId);
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_USER_ID);
	}
};

const getUsersByCompanyId = async (
	companyId: string,
	offset?: number,
	limit?: number,
	filterConditions?: any,
	searchCondition?: any,
	sortCondition?: any
) => {
	const users = await prisma.userCompanyRole.findMany({
		where: {
			// ...restFilterCondition,
			user: { ...searchCondition },
			...filterConditions,
			// status: true,
			companyId: companyId,
			NOT: {
				userId: null,
			},
		},
		orderBy: {
			user: {
				...sortCondition.orderBy,
			},
		},
		include: {
			role: {
				select: {
					id: true,
					roleName: true,
					isAdmin: true,
					status:true
				},
			},
			user: {
				select: {
					id: true,
					email: true,
					fullName: true,
					isVerified: true,
					isActive: true,
					// isSuperAdminCreated:true
				},
			},
			Invitations: {
				select: {
					invitationStatus: true,
				},
			},
		},
		skip: offset,
		take: limit,
	});

	const total = await prisma.userCompanyRole.count({
		where: {
			user: { ...searchCondition},
			...filterConditions,
			companyId: companyId,
			NOT: {
				userId: null,
			},
		},
	});

	return { users, total };
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
			UserCompanyRole: {
				include: {
					company: true,
					role: {
						include: {
							Permission: true,
						},
					},
					Invitations: true,
				},
			},
		},
	});
	return user;
};

const validateUserInCompany = async (userId: string, companyId: string) => {
	const user = await prisma.userCompanyRole.findFirst({
		where: {
			userId: userId,
			companyId: companyId,
			status: true,
		},
	});
	if (!user) {
		throw new ApiException(ErrorCodes.INVALID_USER_ID);
	}
};

const getUsersInRole = async (data: { companyId: string; roles: any[] }) => {
	const users = await prisma.user.findMany({
		where: {
			UserCompanyRole: {
				every: {
					roleId: {
						in: Array.from(data.roles),
					},
					companyId: data.companyId,
				},
			},
		},
	});
	return users;
};

const getUserById = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: {
			id,
			isDeleted: false,
			// isActive: true,
			// isVerified: true,
		},
		include:{
			UserCompanyRole:{
				include:{
					role:true
				}
			}
		}
	});
	return user;
};

const getUserByIdAndCompanyId = async (id: string, companyId: string) => {
	const user = await prisma.user.findFirst({
	  where: {
		id,
		isDeleted: false,
		// UserCompanyRole: {
		//   some: {
		// 	companyId,
		//   },
		// },
	  },
	  include: {
		UserCompanyRole: {
		  where: {
			companyId,
		  },
		  include: {
			role: true,
		  },
		},
	  },
	});
  
	return user;
  };
  

export const userRepository = {
	getActiveUserById,
	getUserByEmail,
	updateUser,
	createUser,
	getSuperUser,
	validateUser,
	getUsersByCompanyId,
	getAllUserByEmail,
	checkUserById,
	validateUserInCompany,
	getUsersInRole,
	getUserById,
	getUserByIdAndCompanyId
};
