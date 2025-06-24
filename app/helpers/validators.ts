import { body, check, param } from 'express-validator';

// Login validation rules
export const loginValidationRules = [
	body('email').notEmpty().withMessage('Email is required'),
	body('email').isEmail().withMessage('Invalid email address'),
	body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidationRules = [
	body('email').isEmail().withMessage('Invalid email address'),
];

// Change Password validation rules
export const changePasswordValidationRules = [
	body('password')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long')
		.matches(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/
		)
		.withMessage(
			'Password should have minimum 8 and maximum 16 characters with at least 1 uppercase, 1 lowercase, 1 number and 1 special character.'
		),

	body('confirmPassword')
		.notEmpty()
		.withMessage('Confirm password required')
		.custom((value: any, { req }: any) => {
			if (value !== req.body.password) {
				throw new Error('Passwords do not match');
			}
			return true;
		}),
];

// Update profile validation rules

export const updateProfileValidationRules = [
	body('firstName')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage(
			'First name length must be minimum 2 characters and maximum 50 characters.'
		),
	body('lastName')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage(
			'Last name length must be minimum 2 characters and maximum 50 characters.'
		),
];

// Delete user validation rules
export const deleteUserValidationRules = [
	body('deleteUserId')
		.notEmpty()
		.withMessage('deleteUserId is required'),
];

// User status update validation rules
export const userStatusUpdateValidationRules = [
	body('userId').notEmpty().withMessage('userId is required'),
	body('isActive').notEmpty().isBoolean().withMessage('isActive is required'),
];

export const inviteUserValidationRules = [
	body('email').isEmail().withMessage('Invalid email address'),
	body('role')
		.notEmpty()
		.withMessage('role is required')
		.isUUID()
		.withMessage('Invalid role id'),
];
export const reInviteUserValidationRules = [
	body('reInviteUserId')
		.notEmpty()
		.withMessage('reInviteUserId id is required'),
];

export const createRoleValidationRules = [
	body('roleName').notEmpty().withMessage('roleName is required'),
];
export const getPermissionByIdValidationRules = [
	param('id').notEmpty().withMessage('Id is required'),
];

export const deleteRoleByIdValidationRules = [
	param('id').notEmpty().withMessage('Id is required'),
];

export const updateRoleValidationRules = [
	body('roleName').notEmpty().withMessage('roleName is required'),
	body('roleDescription').optional().notEmpty().withMessage('Role Description is required'),
	body('roleId').notEmpty().withMessage('Role id is required'),
];

export const cloneRoleValidationRules = [
	body('roleName').notEmpty().withMessage('roleName is required'),
	body('roleDescription').notEmpty().withMessage('Role Description is required'),
	body('cloneRoleId').notEmpty().withMessage('Clone role id is required'),
];

//Company create validation rules
export const createCompanyValidationRules = [
	body('name').trim().notEmpty().withMessage('name is required'),
	body('email')
		.isEmail()
		.trim().notEmpty()
		.withMessage('Invalid email address'),
		body('address').trim().notEmpty().withMessage('address is required'),
];

//Update create validation rules
export const updateCompanyValidationRules = [
	body('companyId').notEmpty().withMessage('company id is required'),
	body('name').trim().notEmpty().withMessage('name is required'),
	body('email').isEmail().withMessage('Invalid email address'),
];

export const deleteCompanyValidationRules = [
	body('companyId').notEmpty().withMessage('companyId is required'),
];

export const deleteRoleValidationRules = [
	body('roleId').notEmpty().withMessage('Role id is required'),
];

export const roleStatusUpdateValidationRules = [
	body('roleId')
		.notEmpty().withMessage('Role id is required')
		.isUUID().withMessage('Role id must be a valid UUID'),
	body('status')
		.isBoolean().withMessage('Status must be a boolean')
		.not().isEmpty().withMessage('Status is required'),
];

export const assignCompanyToDevicesValidationRules = [
	body('deviceIds')
	  .isArray({ min: 1 })
	  .withMessage('deviceIds must be a non-empty array'),
  
	body('deviceIds.*')
	  .isString()
	  .notEmpty()
	  .withMessage('Each deviceId must be a non-empty string'),
  
	body('companyId')
	  .isString()
	  .notEmpty()
	  .withMessage('companyId is required'),
  ];