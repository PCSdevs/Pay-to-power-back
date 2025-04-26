import { prisma } from '../client/prisma';

const addVerificationToken = async (inviteToken: string, userId: string) => {
	const token = await prisma.verifyUserToken.create({
		data: {
			token: inviteToken,
			userId: userId,
		},
	});
	return token;
};

const getVerifyTokenByUser = async (id: string) => {
	const token = await prisma.verifyUserToken.findFirst({
		where: {
			userId: id,
		},
	});
	return token;
};

export const verifyUserTokenRepository = {
	addVerificationToken,
	getVerifyTokenByUser,
};
