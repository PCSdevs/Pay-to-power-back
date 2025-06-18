// service/deviceSubscriptionService.ts
import { RequestExtended } from '../interfaces/global';
import { deviceRepository } from '../repositories/deviceRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { publishMessage, publishMessageWithIST } from '../serverUtils';
// import { publishMessageWithISTTime } from '../utils/mqtt-utils';


const createSubscription = async (req: RequestExtended) => {
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
        companyId:req?.user?.companyId
    });

    await subscriptionRepository.recordHistory({
        subscriptionId: newSubscription.id,
        deviceId: deviceId,
        mode,
        recurring,
        additionalTime: additionalTime,
        dueTimestamp: dueTimestamp,
        action: 'created',
        changedById: req.user.id,
        companyId:req?.user?.companyId
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
        dueTimestamp: dueTimestamp?.toString()
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
        companyId:user?.comanyId
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

const getAllSubscriptions = async (req:RequestExtended) => {
	const subscriptions = await subscriptionRepository.getAll(req?.user.companyId);
	return subscriptions;
};
export const deviceSubscriptionService = {
    createSubscription,
    updateSubscription,
    getAllSubscriptions
};

