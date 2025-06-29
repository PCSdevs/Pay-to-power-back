import { InvitationStatus } from '@prisma/client';
import { prisma } from '../client/prisma';

const addInvitationToUser = async (
	invitedByUserId: string,
	invitedToUserId: string,
	userCompanyRoleId: string,
	invitationStatus: string,
	iniviteToken: string
) => {
	const user = await prisma.invitations.create({
		data: {
			invitationStatus: invitationStatus as InvitationStatus,
			invitedByUserId: invitedByUserId,
			invitedToUserId: invitedToUserId,
			userCompanyRoleId: userCompanyRoleId,
			invitationToken: iniviteToken,
		},
	});
	return user;
};

const updateInvitedUserStatusById = async (id: string) => {
	const user = await prisma.invitations.update({
		where: {
			id: id,
		},
		data: {
			invitationStatus: 'Accepted',
			invitationToken: '',
		},
	});
	return user;
};

const checkInvitationToken = async (invitationToken: string) => {
	const token = await prisma.invitations.findFirst({
		where: {
			invitationToken: invitationToken,
		},
	});
	return token;
};

const getInvitationTokenDetailsByUserCompanyRoleId = async (userCompanyRoleId: string) => {
	const token = await prisma.invitations.findFirst({
		where: {
			userCompanyRoleId: userCompanyRoleId,
		},
	});
	return token;
};
const updateInvitationTokenById = async (id: string,invitationToken:string) => {
	const token = await prisma.invitations.update({
		where: {
			id: id,
		},
		data:{
			invitationToken:invitationToken,
			invitationStatus:'Pending'
		}
	});
	return token;
};

export const invitationsRepository = {
	addInvitationToUser,
	updateInvitedUserStatusById,
	checkInvitationToken,
	getInvitationTokenDetailsByUserCompanyRoleId,
	updateInvitationTokenById
};
