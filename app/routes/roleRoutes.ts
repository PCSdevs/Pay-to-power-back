import express from 'express';
import { cloneRoleValidationRules, createRoleValidationRules, deleteRoleByIdValidationRules, updateRoleValidationRules } from '../helpers/validators';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { roleService } from '../services/roleService';
import asyncHandler from '../utils/async-handler';

const router = express.Router();

router.post(
	'/create',
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

router.delete(
	'/delete/:id',
	isAuthenticated,
	deleteRoleByIdValidationRules,
	asyncHandler(async (req) => {
		return roleService.deleteRoleService(req);
	})
);

router.post(
	'/update-role',
	isAuthenticated,
	updateRoleValidationRules,
	asyncHandler(async (req) => {
		return roleService.updateRoleService(req);
	})
);

router.post(
	'/clone-role',
	isAuthenticated,
	cloneRoleValidationRules,
	asyncHandler(async (req) => {
		return roleService.cloneRoleService(req);
	})
);

router.put(
	'/update-status',
	isAuthenticated,
	asyncHandler(async (req) => {
		return roleService.updateRoleStatusService(req);			
	})
);
export default router;
