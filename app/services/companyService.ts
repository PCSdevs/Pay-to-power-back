
import { RequestExtended } from '../interfaces/global';
import { companyRepository } from '../repositories/companyRepository';
import { userRepository } from '../repositories/userRepository';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { createAndAssignRole } from '../utils/createAndAssignRole';
import { roles } from '../utils/data';


interface CreateCompanyData {
	user: any;
	companyData: any;
}

const createCompany = async ({ user, companyData }: CreateCompanyData) => {
	const { id, isSuperAdmin } = user;

	if (!isSuperAdmin) {
		throw new ApiException(ErrorCodes.MISSING_PERMISSION);
	}

	await userRepository.validateUser(id);

	const data = {
		...companyData,
		createdBy: id,
	};

	const company = await companyRepository.createCompany(data);

	for (const roleData of roles) {
		await createAndAssignRole(roleData, company.id, id, true);
	}
	return {
		message: 'Record created successfully.',
	};
};

const updateCompany = async (req: RequestExtended) => {
	const { companyId, ...dataToUpdate } = req.body;
	const userId = req.user.id;
	const updateData = {
		...dataToUpdate,
		updatedBy: userId,
	};
	await companyRepository.validateCompany(companyId);

	await companyRepository.updateCompany(companyId, updateData);
	return {
		message: 'Record updated successfully.',
	};
};

const deleteCompany = async (req: RequestExtended) => {
	const companyId = req.body.companyId;
	await companyRepository.validateCompany(companyId);
	await companyRepository.deleteCompany(companyId);
	return {
		message: 'Record deleted successfully.',
	};
};

const getAllCompanies = async (req: RequestExtended) => {
	const { page, pageSize, sortBy, sortOrder, search } = req.query;

	// Validate and parse query parameters
	const parsedPage = page ? parseInt(page as string) : undefined;
	const parsedPageSize = pageSize ? parseInt(pageSize as string) : undefined;
	const validSortBy = sortBy || 'name';
	const validSortOrder =
		sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'asc';

	const { total, companies } =
		await companyRepository.getAllCompaniesWithFilterAndSort(
			parsedPage,
			parsedPageSize,
			validSortBy,
			validSortOrder,
			search as string
		);

	return {
		data: companies,
		total,
		message: 'Records fetched successfully.',
	};
};

const getCompanyById = async (req: RequestExtended) => {


	await checkPermission(req.user.id, 	req.user.companyId, {
		moduleName: 'Company Setup',
		permission: ['view'],
	});

	const company = await companyRepository.getCompanyByIdForSetup(
		req.user.id,
		req.user.companyId
	);

	return {
		data: company,
		message: 'Records fetched successfully.',
	};
};


export const companyService = {
	createCompany,
	updateCompany,
	deleteCompany,
	getAllCompanies,
	getCompanyById,
};
