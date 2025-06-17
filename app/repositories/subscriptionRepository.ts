// repository/subscriptionRepository.ts
import { SubscriptionAction } from '@prisma/client';
import { prisma } from '../client/prisma';


const createSubscription = async (data: {
    deviceId: string;
    mode: string;
    recurring?: boolean;
    additionalTime?: string;
    dueTimestamp?: Date;
    companyId:string
}) => {
    return await prisma.subscription.create({
        data: {
            deviceId: data.deviceId,
            mode: data.mode,
            recurring: data.recurring ?? false,
            additionalTime: data.additionalTime,
            dueTimestamp: data.dueTimestamp,
            companyId:data?.companyId
        }
    });
}
const getByDeviceId = async (deviceId: string) => {
    return await prisma.subscription.findFirst({
        where: { deviceId },
    });
};

const updateByDeviceId = async (
    deviceId: string,
    updateData: {
        mode?: string;
        recurring?: boolean;
        additionalTime?: string;
        dueTimestamp?: Date;
    }
) => {
    return await prisma.subscription.updateMany({
        where: { deviceId },
        data: updateData,
    });
};
const recordHistory = async (data: {
    subscriptionId: string;
    deviceId: string;
    mode: string;
    recurring?: boolean;
    additionalTime?: string | null;
    dueTimestamp?: Date | null;
    action: string;
    changedById: string;
    companyId:string
}) => {
    return await prisma.subscriptionHistory.create({
        data: {
            subscriptionId: data.subscriptionId,
            deviceId: data.deviceId,
            mode: data.mode,
            recurring: data.recurring ?? false,
            additionalTime: data.additionalTime,
            dueTimestamp: data.dueTimestamp,
            action: data.action as SubscriptionAction,
            changedById: data.changedById,
            companyId:data?.companyId
        }
    });
}


const getAll = async (companyId:string) => {
	return await prisma.subscription.findMany({
        where:{
            companyId:companyId
        }
    });
};
export const subscriptionRepository = {
    createSubscription,
    getByDeviceId,
    updateByDeviceId,
    recordHistory,
    getAll
};
