import { prisma } from '../client/prisma';

const getForgotPasswordTokenByUser = async (id: string) => {
	const token = await prisma.forgotPasswordToken.findFirst({
		where: {
			userId: id,
		},
	});
	return token;
};

const deleteForgotPasswordTokenByUser = async (id: string) => {
	await prisma.forgotPasswordToken.deleteMany({
		where: {
			userId: id,
		},
	});
};

const createForgotPasswordTokenByUser = async (id: string, token: string) => {
	await prisma.forgotPasswordToken.create({
		data: {
			userId: id,
			token,
		},
	});
};

const getAccessTokenByUser = async (id: string) => {
	const token = await prisma.accessToken.findFirst({
		where: {
			userId: id,
		},
	});
	return token;
};

const deleteAccessTokenByUser = async (id: string) => {
	await prisma.accessToken.deleteMany({
		where: {
			userId: id,
		},
	});
};

const createAccessTokenByUser = async (id: string, token: string) => {
	await prisma.accessToken.create({
		data: {
			userId: id,
			token,
		},
	});
};

const getVerifyTokenByUser = async (id: string) => {
	const token = await prisma.verifyUserToken.findFirst({
		where: {
			userId: id,
		},
	});
	return token;
};

const deleteVerifyTokenByUser = async (id: string) => {
	await prisma.verifyUserToken.deleteMany({
		where: {
			userId: id,
		},
	});
};

const createVerifyTokenByUser = async (id: string, token: string) => {
	await prisma.verifyUserToken.create({
		data: {
			userId: id,
			token,
		},
	});
};

const checkForgetPasswordToken = async (forgetPasswordtoken: string) => {
	const token = await prisma.forgotPasswordToken.findFirst({
		where: {
			token:forgetPasswordtoken,
		},
	});
	return token;
};

export const tokenRepository = {
	getForgotPasswordTokenByUser,
	getAccessTokenByUser,
	deleteAccessTokenByUser,
	createAccessTokenByUser,
	deleteForgotPasswordTokenByUser,
	createForgotPasswordTokenByUser,
	getVerifyTokenByUser,
	deleteVerifyTokenByUser,
	createVerifyTokenByUser,
	checkForgetPasswordToken
};
