import express from 'express';
import {
	changePasswordValidationRules,
	forgotPasswordValidationRules,
	loginValidationRules,
	updateProfileValidationRules,
} from '../helpers/validators';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { authService } from '../services/authService';

const router = express.Router();

router.post(
	'/login',
	loginValidationRules,
	asyncHandler(async (req) => {
		return authService.loginService(req);
	})
);

router.post(
	'/logout',
	isAuthenticated,
	asyncHandler(async (req) => {
		return authService.logoutService(req);
	})
);

router.post(
	'/forgot-password',
	forgotPasswordValidationRules,
	asyncHandler(async (req) => {
		return authService.forgotPassword(req);
	})
);

router.post(
	'/verify-token',
	asyncHandler(async (req) => {
		return authService.verifyForgotPassword(req);
	})
);

router.post(
	'/change-password',
	changePasswordValidationRules,
	asyncHandler(async (req) => {
		return authService.changePassword(req);
	})
);

router.get(
	'/fetch-profile',
	isAuthenticated,
	asyncHandler(async (req) => {
		return authService.fetchProfile(req);
	})
);

router.put(
	'/profile',
	isAuthenticated,
	updateProfileValidationRules,
	asyncHandler(async (req) => {
		return authService.updateProfile(req);
	})
);

export default router;
