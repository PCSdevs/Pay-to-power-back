/* eslint-disable @typescript-eslint/no-explicit-any */

export const ErrorCodes = {
  INTERNAL_SERVER_ERROR: {
    status: 500,
    code: 1000,
    message: "Internal server error.",
  },
  INTERNAL_SERVER_S3_ERROR: {
    status: 500,
    code: 1001,
    message: "Internal server error in uploading file.",
  },
  COMPANY_ALREADY_EXISTS: {
    status: 400,
    code: 1005,
    message: 'Company already exists.',
  },
  UNAUTHORIZED: {
    status: 401,
    code: 1100,
    message: "Unauthorized.",
  },
  INVALID_COMPANY_ID: {
    status: 400,
    code: 1005,
    message: 'Invalid company id.',
  },
  NOT_ACTIVE: {
    status: 401,
    code: 1101,
    message: 'User is not active in any company',
  },
  ADMIN_UNAUTHORIZED: {
    status: 403,
    code: 1102,
    message: "Unauthorized role.",
  },
  MISSING_PERMISSION: {
    status: 403,
    code: 1103,
    message: 'Missing permission.',
  },
  CANNOT_DELETE_ADMIN: {
    status: 400,
    code: 1104,
    message: 'Cannot delete admin.',
  },
  INVITATION_ALREADY_ACCEPTED: {
    status: 400,
    code: 1105,
    message: 'Invitation is already accepted.',
  },
  ROLE_NOT_FOUND: {
    status: 400,
    code: 1106,
    message: 'role not found.'
  },
  BAD_REQUEST: {
    status: 400,
    code: 1200,
    message: "Bad request.",
  },
  REFRESH_VALIDITY_EXPIRED: {
    status: 401,
    code: 1201,
    message: "Refresh validity expired.",
  },
  INVALID_CREDENTIALS: {
    status: 401,
    code: 1202,
    message: "Invalid credentials.",
  },
  INVALID_USER_COMPANY_ROLE_ID: {
    status: 400,
    code: 1008,
    message: 'Invalid user company role id.',
  },
  MISSING_DEVICE_ID: {
    status: 400,
    code: 1300,
    message: "Device ID is missing.",
  },
  INACTIVE_USER: {
    status: 403,
    code: 1301,
    message: "Your account has been deactivated by the admin.",
  },
  USER_ALREADY_EXISTS: {
    status: 409,
    code: 1302,
    message: "User with the same email already exists.",
  },
  BUY_SUBSCRIPTION: {
    status: 403,
    code: 1303,
    message: "Buy subscription to proceed.",
  },
  ID_REQUIRED: {
    status: 400,
    code: 1400,
    message: "ID is required.",
  },
  USER_NOT_FOUND: {
    status: 404,
    code: 1401,
    message: "User not found.",
  },
  DEVICE_NOT_FOUND: {
    status: 404,
    code: 1402,
    message: "Device not found.",
  },
  USER_NOT_VERIFIED: {
    status: 401,
    code: 1403,
    message: "User not verified. Please verify your email.",
  },
  INVALID_USER_ID: {
    status: 401,
    code: 1500,
    message: "Invalid user ID.",
  },
  EXPIRED_TOKEN: {
    status: 401,
    code: 1501,
    message: "Token has expired.",
  },
  INVALID_TOKEN: {
    status: 401,
    code: 1502,
    message: "Invalid token.",
  },
  INVALID_VALUE: {
    status: 400,
    code: 1503,
    message: "Invalid value.",
  },
  INVALID_PASSWORD: {
    status: 400,
    code: 1504,
    message: "New password cannot be the same as the old password.",
  },
  INVALID_OTP: {
    status: 401,
    code: 1505,
    message: "Invalid OTP. Enter a valid OTP.",
  },
  OTP_EXPIRED: {
    status: 401,
    code: 1506,
    message: "OTP expired. Try again.",
  },
  SAME_PASSWORD: {
    status: 400,
    code: 1507,
    message: "New password cannot be the same as the old password.",
  },
  WRONG_EMAIL: {
    status: 400,
    code: 1508,
    message: "Incorrect email address.",
  },
  ROLE_ALREADY_EXISTS: {
    status: 400,
    code: 1509,
    message: 'Role with same name already there in company.',
  },
  SAME_EMAIL: {
    status: 400,
    code: 1510,
    message: "User with same email already exits.",
  },
  INVALID_ROLE_ID: {
    status: 400,
    code: 1600,
    message: "Invalid role ID.",
  },
  INVALID_DEVICE_ID: {
    status: 400,
    code: 1601,
    message: "Invalid device ID.",
  },
  DATE_GREATER_THAN_TODAY: {
    status: 400,
    code: 1602,
    message: "Start date and end date cannot be greater than today.",
  },
  CUSTOM_ERROR: (status: number, code: number, message: string) => ({
    status,
    code,
    message,
  }),
  GENERATE_BAD_REQUEST: (errorDescription: string) => ({
    ...ErrorCodes.BAD_REQUEST,
    errorDescription,
  }),
  CANNOT_DELETE_ROLE: {
    status: 400,
    code: 1603,
    message: 'Deletion failed, users are still linked to this role.',
  },
};
export const ValidationMessages = {
  GENERATE_INVALID_INPUT: (arr: any) =>
    `- invalid input, possible values: ${arr.join(", ")}`,
  NOT_EMPTY: "must not be null.",
  MUST_BE_ARRAY: "must be array.",
  NOT_EMPTY_ARRAY: "are required.",
  INVALID_INPUT: "- invalid input.",
  MUST_BE_BOOLEAN: "- must be not null boolean.",
  MUST_BE_NUMBER: "- must be number.",
  MUST_BE_NUMBER_GTE_1: "- must be number greater than or equal to 1.",
  MIN_VALUE: "- minimum value must be ",
  NOT_EMPTY_BODY_ARRAY: "body must be a non empty array.",
};

export const BaseResponse = (result: any) => {
  // console.log('object', result);
  return { ...result, responseStatus: 200 };
};
