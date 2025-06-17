// service/deviceSubscriptionService.ts
import { RequestExtended } from '../interfaces/global';
import { deviceRepository } from '../repositories/deviceRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { publishMessage, publishMessageWithIST } from '../serverUtils';
// import { publishMessageWithISTTime } from '../utils/mqtt-utils';


const createSubscription = async (req: RequestExtended) => {
    const {
        device_id,
        mode,
        recurring,
        additional_time,
        due_timestamp
    } = req.body;

    const device = await deviceRepository.getDeviceById(device_id);
    if (!device) {
        throw new Error('Device not found');
    }

    const newSubscription = await subscriptionRepository.createSubscription({
        deviceId: device_id,
        mode,
        recurring,
        additionalTime: additional_time,
        dueTimestamp: due_timestamp,
        companyId:req?.user?.companyId
    });

    await subscriptionRepository.recordHistory({
        subscriptionId: newSubscription.id,
        deviceId: device_id,
        mode,
        recurring,
        additionalTime: additional_time,
        dueTimestamp: due_timestamp,
        action: 'created',
        changedById: req.user.id,
        companyId:req?.user?.companyId
    });

    const mqtt_payload = {
        event: 'subscription_created',
        subscription_id: newSubscription.id,
        device_id,
        device_name: device.name,
        device_mac: device.macAddress,
        mode,
        recurring,
        additional_time: additional_time?.toString(),
        due_timestamp: due_timestamp?.toString()
    };

    publishMessageWithIST(
        `device/${device_id}/subscription`,
        mqtt_payload,
        String(device_id)
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
    // Step 1: Fetch existing subscription
    const existing = await subscriptionRepository.getByDeviceId(deviceId);
    if (!existing) {
        throw new Error('Subscription not found');
    }

    // Step 2: Update subscription with new fields
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

    // Step 4: Fetch final updated record
    const final = await subscriptionRepository.getByDeviceId(deviceId);

    // Step 5: Publish MQTT notification
    await publishMessage(
        `devices/${deviceId}/subscription`,
        JSON.stringify({
            device_id: final?.deviceId,
            mode: final?.mode,
            recurring: final?.recurring,
            additional_time: final?.additionalTime,
            due_timestamp: final?.dueTimestamp?.toISOString?.(),
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

