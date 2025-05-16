import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import {
	deleteUserValidationRules,
	inviteUserValidationRules,
	reInviteUserValidationRules,
} from '../helpers/validators';
import { RequestExtended } from '../interfaces/global';
import { userService } from '../services/userService';

const router = express.Router();

router.post(
	'/invite-user',
	isAuthenticated,
	inviteUserValidationRules,
	asyncHandler(async (req) => {
		return userService.inviteUserService(req);
	})
);

router.post(
	'/reinvite-user',
	isAuthenticated,
	reInviteUserValidationRules,
	asyncHandler(async (req:RequestExtended) => {
		const {user}=req
		const {userCompanyRoleId}=req.body
		const data={user:user,userCompanyRoleId:userCompanyRoleId}
		return userService.reInviteUserService(data);
	})
);

router.post(
	'/verify-token',
	asyncHandler(async (req) => {
		return userService.verifyInvitationToken(req);
	})
);

router.get(
	'/',
	isAuthenticated,
	asyncHandler(async (req) => {
		return userService.getUsersService(req);
	})
);

router.delete(
	'/',
	isAuthenticated,
	deleteUserValidationRules,
	asyncHandler(async (req: RequestExtended) => {
		const { deleteUserId } = req.body;
		return userService.deleteUserService(deleteUserId, req.user);
	})
);

router.put(
	'/',
	isAuthenticated,
	asyncHandler(async (req: RequestExtended) => {
		const user = req.user;

		const data = {
			user: user,
			updateUserId: req.body.userId,
			roleId: req.body.roleId,
			fullName: req.body.fullName,
		};

		return userService.updateUserService(data);
	})
);

router.put(
	'/status-update',
	isAuthenticated,
	asyncHandler(async (req: RequestExtended) => {
		const data = {
			user: req.user,
			updateUserCompanyRoleId: req.body.updateUserCompanyRoleId,
			status: req.body.status,
		};

		return userService.userStatusUpdateService(data);
	})
);

export default router;
