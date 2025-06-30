// service/deviceSubscriptionService.ts
import moment from 'moment';
import { RequestExtended } from '../interfaces/global';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { deviceRepository } from '../repositories/deviceRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { publishMessage, publishMessageWithIST, storeMessage } from '../serverUtils';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';


const createSubscription = async (req: RequestExtended) => {

    const { user } = req

    await checkPermission(user.id, user.companyId, {
        moduleName: 'Subscription',
        permission: ['add'],
    });

    const {
        deviceId,
        mode,
        recurring,
        additionalTime,
        dueTimestamp
    } = req.body;

    const device = await deviceRepository.getDeviceById(deviceId);

    if (!device) {
        throw new ApiException(ErrorCodes.DEVICE_NOT_FOUND)
    }

    const newSubscription = await subscriptionRepository.createSubscription({
        deviceId:deviceId,
        mode,
        recurring,
        additionalTime,
        dueTimestamp,
        companyId: req?.user?.companyId
    });

    const istMoment = moment.utc(dueTimestamp).tz("Asia/Kolkata");

    await subscriptionRepository.recordHistory({
        subscriptionId: newSubscription.id,
        deviceId: deviceId,
        mode,
        recurring,
        additionalTime: additionalTime,
        dueTimestamp: istMoment.toDate(),
        action: 'CREATED',
        changedById: req.user.id,
        companyId: req?.user?.companyId
    });

    const mqttPayload = {
        event: 'subscriptionCreated',
        subscriptionId: newSubscription.id,
        deviceId: device?.generatedDeviceId,
        deviceName: device.name,
        deviceMacAddress: device.macAddress,
        mode,
        recurring,
        additionalTime: additionalTime?.toString(),
        dueTimestamp: istMoment.toDate()?.toString(),
        source:'server'
    };
    
    storeMessage(device?.id, `device/${device?.generatedDeviceId}/subscription`, JSON.stringify(mqttPayload));

    await publishMessage(`device/${device?.generatedDeviceId}/online`, JSON.stringify({checkingConnection:"isDeviceOnline",source:'server'}));

    // publishMessageWithIST(
    //     `device/${deviceId}/subscription`,
    //     mqtt_payload,
    //     String(deviceId)
    // );

    return {
        message: 'Subscription created successfully',
        data: newSubscription
    };
}

const updateSubscription = async (
    deviceId: string,
    updateData: {
        mode?: string;
        recurring?: boolean;
        additionalTime?: number;
        dueTimestamp?: string;
    },
    user: any
) => {

    await checkPermission(user.id, user.companyId, {
        moduleName: 'Subscription',
        permission: ['edit'],
    });

    const existing = await subscriptionRepository.getByDeviceId(deviceId);

    if (!existing) {
        throw new Error('Subscription not found');
    }

   const subscriptionData :any = await subscriptionRepository.updateByDeviceId(deviceId, {
        mode: updateData.mode,
        recurring: updateData.recurring,
        additionalTime: updateData.additionalTime?.toString(),
        dueTimestamp: updateData.dueTimestamp ? new Date(updateData.dueTimestamp) : null,
    });

    // Step 3: Record update history
    await subscriptionRepository.recordHistory({
        subscriptionId:existing.id,
        deviceId: deviceId,
        mode: updateData.mode ??existing.mode,
        recurring: updateData.recurring ??existing.recurring,
        additionalTime: updateData.additionalTime?.toString() ??existing.additionalTime,
        dueTimestamp: updateData.dueTimestamp
            ? new Date(updateData.dueTimestamp)
            :existing.dueTimestamp,
        action: 'UPDATED',
        changedById: user?.id,
        companyId: user?.companyId
    });

    const final = await subscriptionRepository.getByDeviceId(deviceId);

    const deviceData= await deviceRepository.getDeviceById(deviceId)

    storeMessage(deviceId, `device/${deviceData?.generatedDeviceId}/subscription`, JSON.stringify({
        // deviceId: final?.deviceId,
        mode: final?.mode,
        recurring: final?.recurring,
        additionalTime: final?.additionalTime, 
        dueTimestamp: moment.utc(final?.dueTimestamp).tz("Asia/Kolkata").toDate()?.toString(),
        status: 'Subscription updated.',
        code:200
    }));


    await publishMessage(`device/${deviceData?.generatedDeviceId}/online`, JSON.stringify({ checkingConnection: "isDeviceOnline",source:'server' }));


    return final;
};

const getAllSubscriptions = async (req: RequestExtended) => {

    const { user } = req

    await checkPermission(user.id, user.companyId, {
        moduleName: 'Subscription',
        permission: ['view'],
    });

    const subscriptions = await deviceRepository?.getAllDevicesWithSubscriptions(user?.companyId);
    return {data :subscriptions , message : 'Subscriptions fetched successfully'};
};
export const deviceSubscriptionService = {
    createSubscription,
    updateSubscription,
    getAllSubscriptions
};

