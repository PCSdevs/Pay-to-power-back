// service/deviceSubscriptionService.ts
import moment from 'moment';
import { RequestExtended } from '../interfaces/global';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { deviceRepository } from '../repositories/deviceRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { publishMessage, publishMessageWithIST } from '../serverUtils';


const createSubscription = async (req: RequestExtended) => {

    const { user } = req

    await checkPermission(user.id, user.companyId, {
        moduleName: 'Subcription',
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
        throw new Error('Device not found');
    }

    const newSubscription = await subscriptionRepository.createSubscription({
        deviceId,
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
        action: 'created',
        changedById: req.user.id,
        companyId: req?.user?.companyId
    });

    const mqtt_payload = {
        event: 'subscriptionCreated',
        subscription_id: newSubscription.id,
        deviceId,
        deviceName: device.name,
        deviceMacAddress: device.macAddress,
        mode,
        recurring,
        additionalTime: additionalTime?.toString(),
        due_timestamp: dueTimestamp?.toString()
    };

    publishMessageWithIST(
        `device/${deviceId}/subscription`,
        mqtt_payload,
        String(deviceId)
    );

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
        moduleName: 'Subcription',
        permission: ['edit'],
    });

    const existing = await subscriptionRepository.getByDeviceId(deviceId);
    if (!existing) {
        throw new Error('Subscription not found');
    }

    await subscriptionRepository.updateByDeviceId(deviceId, {
        mode: updateData.mode,
        recurring: updateData.recurring,
        additionalTime: updateData.additionalTime?.toString(),
        dueTimestamp: updateData.dueTimestamp ? new Date(updateData.dueTimestamp) : undefined,
    });

    // Step 3: Record update history
    await subscriptionRepository.recordHistory({
        subscriptionId: existing.id,
        deviceId: deviceId,
        mode: updateData.mode ?? existing.mode,
        recurring: updateData.recurring ?? existing.recurring,
        additionalTime: updateData.additionalTime?.toString() ?? existing.additionalTime,
        dueTimestamp: updateData.dueTimestamp
            ? new Date(updateData.dueTimestamp)
            : existing.dueTimestamp,
        action: 'updated',
        changedById: user?.userId,
        companyId: user?.comanyId
    });

    const final = await subscriptionRepository.getByDeviceId(deviceId);

    await publishMessage(
        `devices/${deviceId}/subscription`,
        JSON.stringify({
            device_id: final?.deviceId,
            mode: final?.mode,
            recurring: final?.recurring,
            additionalTime: final?.additionalTime,
            dueTimestamp: final?.dueTimestamp?.toISOString?.(),
            status: 'Subscription updated',
        }),
        deviceId
    );

    return final;
};

const getAllSubscriptions = async (req: RequestExtended) => {

    const { user } = req

    await checkPermission(user.id, user.companyId, {
        moduleName: 'Subcription',
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

