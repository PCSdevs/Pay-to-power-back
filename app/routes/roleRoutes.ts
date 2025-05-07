import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { createRoleValidationRules } from '../helpers/validators';
import { roleService } from '../services/roleService';

const router = express.Router();

router.post(
	'/',
	isAuthenticated,
	createRoleValidationRules,
	asyncHandler(async (req) => {
		return roleService.createRoleService(req);
	})
);

router.get(
	'/options',
	isAuthenticated,
	asyncHandler(async (req) => {
		return roleService.getRoleOptionService(req);
	})
);

router.get(
	'/',
	isAuthenticated,
	asyncHandler(async (req) => {
		return roleService.getRoleService(req);
	})
);

export default router;
