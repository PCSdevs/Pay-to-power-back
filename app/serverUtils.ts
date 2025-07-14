import fs from 'fs';
import mqtt from 'mqtt';
import path from 'path';
import os from 'os';
import { prisma } from './client/prisma';
import { deviceRepository } from './repositories/deviceRepository';
import { userRepository } from './repositories/userRepository';
import { logger } from './utils/logger';

const CA_PATH = path.resolve(__dirname, './certs/emqxsl-ca.crt');

const options: mqtt.IClientOptions = {
    host: process?.env?.EMQX_ENDPOINT,
    port: parseInt(process?.env?.EMQX_PORT as string),
    protocol: 'mqtts',
    username: process?.env?.EMQX_USERNAME,
    password: process?.env?.EMQX_PASSWORD,
    clientId: `backend-logger-${os.hostname()}`,
    ca: fs.readFileSync(CA_PATH),
    rejectUnauthorized: true,
    reconnectPeriod: 1000,
    resubscribe: true,
};

const client = mqtt.connect(options);

// ✅ Subscriptions managed once
function subscribeToTopics() {
    const topics = ['device/+/+', 'device/+']; // keeping original duplicates for exact match
    topics.forEach(topic => {
        client.subscribe(topic, (err) => {
            if (err) {
                logger.error(`❌ Failed to subscribe to ${topic}`);
            } else {
                logger.info(`📡 Subscribed to ${topic}`);
            }
        });
    });
}

client.on('connect', () => {
    logger.info('✅ Connected to EMQX Cloud MQTT broker');
    subscribeToTopics();
});

client.on('error', (error: any) => {
    logger.error(`❌ MQTT Error: ${error.message}`);
});

client.on('reconnect', () => {
    logger.warn('🔁 MQTT client attempting to reconnect');
});

client.on('offline', () => {
    logger.warn('📴 MQTT client went offline');
});

client.on('close', () => {
    logger.warn('❌ MQTT connection closed');
});

client.on('message', async (topic: string, payload: Buffer) => {
    const rawPayload = payload.toString();
    let data: any;

    try {
        data = JSON.parse(rawPayload);
    } catch (err: any) {
        logger.warn(`⚠️ Skipping non-JSON message on topic ${topic}`);
        return;
    }

    if (data?.source === 'server') return;

    const onlineMatch = topic.match(/^device\/([^/]+)\/online$/);
    if (onlineMatch) {
        const deviceId = onlineMatch[1];
        logger.info(`📶 Device is online: ${deviceId}`);

        const { secreteKey } = data
        const deviceData = await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId);

        // if (deviceData?.secreteKey !== secreteKey) {

        //     const mqttPayload = {
        //         code: 401,
        //         status: 'invalid secreteKey.',
        //         source: 'server'
        //     };

        //     const responseTopic = `device/error`;
        //     await publishMessage(responseTopic, JSON.stringify(mqttPayload));
        //     return;
        // }
        if (!deviceData) {
            const mqttPayload = {
                code: 401,
                status: 'device not found.',
                source: 'server'
            };

            const responseTopic = `device/error`;
            await publishMessage(responseTopic, JSON.stringify(mqttPayload));
            return;
        }

        if (deviceData?.isClientModeOn) {
            await prisma.device.update({
                where: {
                    generatedDeviceId: deviceData.id
                },
                data: {
                    isClientModeOn: false
                }
            })
        }

        const messages = await prisma.message.findFirst({
            where: {
                deviceId: deviceData.id,
                deliveryStatus: 'PENDING',
            },
        });

        if (messages) {
            await publishMessage(messages?.topic, JSON.stringify({
                ...JSON.parse(messages?.payload),
                source: 'server',
            }));
        }
    }

    const acknowledgedMatch = topic.match(/^device\/([^/]+)\/acknowledge$/);
    if (acknowledgedMatch) {
        const deviceId = acknowledgedMatch[1];
        logger.info(`📶 Device is online: ${deviceId}`);

        const { topic, secreteKey } = data;

        if (
            typeof topic !== 'string' || topic.trim() === ''
        ) {
            const mqttPayload = {
                code: 401,
                status: 'topic is required.',
                source: 'server'
            };

            const responseTopic = `device/error`;
            await publishMessage(responseTopic, JSON.stringify(mqttPayload));
            return;
        }

        const deviceData = await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId);

        // if (deviceData?.secreteKey !== secreteKey) {

        //     const mqttPayload = {
        //         code: 401,
        //         status: 'invalid secreteKey.',
        //         source: 'server'
        //     };

        //     const responseTopic = `device/error`;
        //     await publishMessage(responseTopic, JSON.stringify(mqttPayload));
        //     return;
        // }
        if (!deviceData) {
            const mqttPayload = {
                code: 401,
                status: 'device not found.',
                source: 'server'
            };

            const responseTopic = `device/error`;
            await publishMessage(responseTopic, JSON.stringify(mqttPayload));
            return;
        }

        const sentMessage = await prisma?.message?.findFirst({
            where: {
                deviceId: deviceData?.id,
                topic,
                deliveryStatus: "PENDING"
            }
        });

        if (sentMessage) {
            await prisma.message?.update({
                where: { id: sentMessage.id },
                data: { deliveryStatus: 'ACKNOWLEDGED' }
            });

            if (topic.includes('/clientMode')) {
                await prisma.device.update({
                    where: {
                        generatedDeviceId: deviceData.id
                    },
                    data: {
                        isClientModeOn: true
                    }
                })
            }
        }

        const messages = await prisma.message.findFirst({
            where: {
                deviceId: deviceData?.id,
                deliveryStatus: 'PENDING',
            },
        });

        if (messages) {
            const parsedPayload = JSON.parse(messages?.payload || '{}');
            await publishMessage(messages?.topic, JSON.stringify({ ...parsedPayload, source: 'server' }));
        }
    }

    if (topic === 'device/register') {
        const { macAddress, boardNumber } = data;

        logger.info(`📥 Registering device: ${macAddress}`);
        const superuser = await userRepository.getSuperUser();
        const isDeviceExits = await deviceRepository.getDeviceByMac(macAddress);

        if (isDeviceExits) {
            const mqttPayload = {
                code: 401,
                status: 'device with same macAddress already registered.',
                source: 'server'
            };

            const responseTopic = `device/register`;
            await publishMessage(responseTopic, JSON.stringify(mqttPayload));
            return;
        }

        if (
            typeof macAddress !== 'string' || macAddress.trim() === '' ||
            typeof boardNumber !== 'string' || boardNumber.trim() === ''
        ) {
            const mqttPayload = {
                code: 401,
                status: 'macAddress and boardNumber both required.',
                source: 'server'
            };

            const responseTopic = `device/error`;
            await publishMessage(responseTopic, JSON.stringify(mqttPayload));
            return;
        }


        const newDevice = await deviceRepository.createDevice({
            macAddress,
            boardNumber,
            userId: superuser as string,
        });

        const mqttPayload = {
            deviceId: newDevice.generatedDeviceId,
            macAddress: newDevice.macAddress,
            secreteKey: newDevice.secreteKey,
            status: 'Device register successfully.',
            code: 200,
            source: 'server'
        };

        const responseTopic = `device/register`;
        await publishMessage(responseTopic, JSON.stringify(mqttPayload));
    }

});

export async function storeMessage(deviceId: string, topic: string, payload: string) {
    try {
        const deliveryStatus = 'PENDING';

        const existing = await prisma.message.findFirst({
            where: { deviceId, topic, deliveryStatus },
        });

        if (existing) {
            return await prisma.message.update({
                where: { id: existing.id },
                data: { payload, timestamp: new Date() },
            });
        } else {
            return await prisma.message.create({
                data: { deviceId, topic, payload, deliveryStatus },
            });
        }
    } catch (err: any) {
        logger.error(`❌ Failed to store message: ${err.message}`);
    }
}

async function getPendingMessages(deviceId: string) {
    return await prisma.message.findMany({
        where: { deviceId, deliveryStatus: 'PENDING' },
        select: { topic: true, payload: true },
    });
}

async function acknowledgeMessage(deviceId: string, topic: string) {
    try {
        await prisma.message.updateMany({
            where: { deviceId, topic },
            data: { deliveryStatus: 'ACKNOWLEDGED' },
        });
        logger.info(`✅ Acknowledged message for ${deviceId}, category ${topic}`);
    } catch (err: any) {
        logger.error(`❌ Acknowledge error: ${err.message}`);
    }
}

export async function publishMessage(topic: string, message: string) {
    client.publish(topic, message, {}, (err: any) => {
        if (err) logger.error(`❌ Publish failed: ${err.message}`);
        else logger.info(`📤 Sent '${message}' to topic '${topic}'`);
    });
    return true;
}

export async function publishMessageWithIST(
    topic: string,
    payload: Record<string, any>,
    deviceId: string
) {
    const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
    });
    payload.timestamp_ist = now;
    const message = JSON.stringify(payload);
    return publishMessage(topic, message);
}
