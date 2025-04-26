import jwt from 'jsonwebtoken';
import { configData } from './../config/config';


// Generate AccessToken
export const generateAccessToken = (payload: any) => {
	const token = jwt.sign(payload, configData?.accessTokenSecretKey as string, {
		expiresIn: 24 * 60 * 60, // in seconds,
	});

	return token;
};

// Generate Forgot Password Token
export const generateForgotPasswordToken = (payload: any) => {
	const token = jwt.sign(payload, configData?.forgotPasswordTokenSecretKey as string, {
		expiresIn: 24 * 60 * 60, // in seconds,
	});
	return token;
};

// Generate verification Token
export const generateVerificationToken = (payload: any) => {
	const token = jwt.sign(payload, configData?.verificationTokenSecretKey as string, {
		expiresIn: 60 * 60 * 8,
	});
	return token;
};

// Verify Access Token
export const verifyAccessToken = (accessToken: string) => {
	const verified = jwt.verify(accessToken, configData?.accessTokenSecretKey as string);

	return verified;
};

// Verify Forgot Password Token
export const verifyForgotPasswordToken = (forgotPasswordToken: any) => {
	const verified = jwt.verify(
		forgotPasswordToken,
		configData?.forgotPasswordTokenSecretKey as string
	);
	return verified;
};

// Verify Forgot Password Token
export const verifyVerificationToken = (verificationToken: any) => {
	const verified = jwt.verify(
		verificationToken,
		configData?.verificationTokenSecretKey as string
	);
	return verified;
};

export const isTokenExpired = (unixTimestamp: number) => {
	// Get the current time in seconds
	const currentTimestamp = Math.floor(Date.now() / 1000);

	// Compare the given Unix timestamp with the current timestamp
	return unixTimestamp <= currentTimestamp;
};
