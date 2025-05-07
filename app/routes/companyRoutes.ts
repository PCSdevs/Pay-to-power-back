import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { authService } from '../services/authService';
import { RequestExtended } from '../interfaces/global';
import {
	createCompanyValidationRules,
	deleteCompanyValidationRules,
	updateCompanyValidationRules,
} from '../helpers/validators';
import { companyService } from '../services/companyService';

const router = express.Router();

router.post(
	'/',
	isAuthenticated,
	asyncHandler(async (req) => {
		return authService.changeCompany(req);
	})
);

router.get(
	'/',
	isAuthenticated,
	asyncHandler(async (req: RequestExtended) => {
		const result = await companyService.getAllCompanies(req);
		return result;
	})
);

router.post(
	'/create',
	isAuthenticated,
	createCompanyValidationRules,
	asyncHandler(async (req: RequestExtended) => {
		const data = {
			user: req.user,
			companyData: req.body,
		};
		const result = await companyService.createCompany(data);
		return result;
	})
);

router.put(
	'/',
	isAuthenticated,
	updateCompanyValidationRules,
	asyncHandler(async (req: RequestExtended) => {
		const result = await companyService.updateCompany(req);
		return result;
	})
);

router.delete(
	'/',
	isAuthenticated,
	deleteCompanyValidationRules,
	asyncHandler(async (req: RequestExtended) => {
		const result = await companyService.deleteCompany(req);
		return result;
	})
);


router.get(
	'/details',
	isAuthenticated,
	asyncHandler(async (req: RequestExtended) => {
		const result = await companyService.getCompanyById(req);
		return result;
	})
);



export default router;
