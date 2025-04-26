import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { permissionService } from '../services/permissionService';
import { getPermissionByIdValidationRules } from '../helpers/validators';

const router = express.Router();

router.put(
	'/',
	isAuthenticated,
	// inviteUserValidationRules,
	asyncHandler(async (req) => {
		return permissionService.updatePermissionService(req);
	})
);
router.get(
	'/:id',
	isAuthenticated,
	getPermissionByIdValidationRules,
	asyncHandler(async (req) => {
		return permissionService.getPermissionsByRoleIdService(req);
	})
);

export default router;
