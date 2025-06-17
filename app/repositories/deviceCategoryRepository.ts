import { prisma } from '../client/prisma';

const createCategory = async (data: { name: string; description?: string; companyId: string }) => {
	return await prisma.deviceCategory.create({ data });
};

const getAllCategories = async (companyId: string) => {
	return await prisma.deviceCategory.findMany({
		where: {
            companyId:companyId
		},
	});
};

const getCategoryById = async (id: string) => {
	return await prisma.deviceCategory.findFirst({
		where: {
			id
		},
	});
};

export const deviceCategoryRepository = {
	createCategory,
	getAllCategories,
	getCategoryById,
};
