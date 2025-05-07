import { prisma } from '../client/prisma';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';

// Get all companies for super admin

const getAllCompanies = async () => {
	const companies = await prisma.company.findMany({
		where: { isDeleted: false },
		orderBy: {
			name: 'asc',
		},
	});
	return companies;
};

const getUserWiseCompanies = async (userId: string) => {
	const companies = await prisma.userCompanyRole.findMany({
		where: {
			userId: userId,
		},
		include: {
			company: true,
		},
	});
	return companies;
};

const getCompanyById = async (id: string) => {
	const user = await prisma.company.findFirst({
		where: {
			id,
		},
	});
	return user;
};

const validateCompany = async (companyId: string) => {
	const company = await getCompanyById(companyId);
	if (!company) {
		throw new ApiException(ErrorCodes.INVALID_COMPANY_ID);
	}
	return company;
};

const createCompany = async (data: any) => {
	const company = await prisma.company.create({
		data,
	});
	return company;
};

const updateCompany = async (companyId: string, data: any) => {
	const company = await prisma.company.update({
		where: { id: companyId },
		data,
	});
	return company;
};

const deleteCompany = async (companyId: string) => {
	const company = await prisma.company.update({
		where: { id: companyId },
		data: { isDeleted: true },
	});
	return company;
};

const getAllCompaniesWithFilterAndSort = async (
	page?: number,
	pageSize?: number,
	sortBy?: any,
	sortOrder: 'asc' | 'desc' = 'asc',
	search?: string
) => {
	const skip = page && pageSize ? (page - 1) * pageSize : undefined;
	const take = pageSize;
	const whereClause: any = { isDeleted: false };

	if (search) {
		whereClause.OR = [
			{ name: { contains: search, mode: 'insensitive' } },
			{ tpin: { contains: search, mode: 'insensitive' } },
		];
	}

	const totalPromise = prisma.company.count({
		where: whereClause,
	});

	const companyPromise = prisma.company.findMany({
		where: whereClause,
		skip: skip,
		take: take,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const [total, companies] = await prisma.$transaction([
		totalPromise,
		companyPromise,
	]);

	return {
		total,
		companies,
	};
};


const isCompanyAdmin = async (userId: string, companyId: string) => {
	const userCompanyRole = await prisma.userCompanyRole.findFirst({
		where: {
			userId: userId,
			companyId: companyId,
			role: {
				isAdmin: true,
			},
		},
		include: {
			role: true,
		},
	});

	return !!userCompanyRole;
};

const getCompanyByIdForSetup = async (userId: string, companyId: string) => {

	const company = await prisma.company.findMany({
		where: {
			id: companyId,
			isDeleted: false,
		}
	});

	return company;

	//	return company;
};

export const companyRepository = {
	getCompanyById,
	validateCompany,
	getAllCompanies,
	getUserWiseCompanies,
	createCompany,
	updateCompany,
	getAllCompaniesWithFilterAndSort,
	deleteCompany,
	getCompanyByIdForSetup
};
