// src/server.ts
import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import { prisma } from './client/prisma';
import { setTimeout as sleep } from 'timers/promises';
import { MessageCategory } from '@prisma/client';

const EMQX_ENDPOINT = 'm0b8890a.ala.dedicated.aws.emqxcloud.com';
const EMQX_PORT = 8883;
const CA_PATH = path.resolve(__dirname, './certs/emqxcloud-ca.crt');

const options: mqtt.IClientOptions = {
    host: EMQX_ENDPOINT,
    port: EMQX_PORT,
    protocol: 'mqtts',
    username: 'harshil',
    password: 'harshil',
    ca: fs.readFileSync(CA_PATH),
    rejectUnauthorized: true,
};

// const options: mqtt.IClientOptions = {
//     host: 'test.mosquitto.org',
//     port: 1883,
//     protocol: 'mqtt',
//   };

const client = mqtt.connect(options);

client.on('connect', () => {
    logger.info('✅ Connected to EMQX Cloud MQTT broker');
});

client.on('error', (error: any) => {
    logger.error(`❌ MQTT Error: ${error.message}`);
});

client.on('message', async (topic: any, payload: any) => {
    try {
        const data = JSON.parse(payload.toString());
        if (data.type === 'acknowledge') {
            const { device_id, category } = data;
            if (device_id && category) {
                await acknowledgeMessage(device_id, category);
            }
        }
    } catch (err: any) {
        logger.error(`❌ Error processing message: ${err.message}`);
    }
});

async function storeMessage(
    deviceId: string,
    category: string,
    topic: string,
    payload: string
) {
    try {
        await prisma.message.upsert({
            where: {
                deviceId_category: {
                    deviceId,
                    category: category as MessageCategory,
                },
            },
            update: {
                topic,
                payload,
                deliveryStatus: 'pending',
                timestamp: new Date(),
            },
            create: {
                deviceId,
                category: category as MessageCategory,
                topic,
                payload,
                deliveryStatus: 'pending',
            },
        });
        logger.info(`✅ Stored message for ${deviceId}, category ${category}`);
    } catch (err: any) {
        logger.error(`❌ Failed to store message: ${err.message}`);
    }
}

// async function updateDeviceStatus(deviceId: string, isOnline: boolean) {
//   try {
//     await prisma.deviceStatus.upsert({
//       where: { deviceId },
//       update: {
//         lastSeen: new Date(),
//         isOnline,
//       },
//       create: {
//         deviceId,
//         lastSeen: new Date(),
//         isOnline,
//       },
//     });
//     logger.info(`✅ Updated status for ${deviceId}: ${isOnline ? 'online' : 'offline'}`);
//   } catch (err:any) {
//     logger.error(`❌ Failed to update device status: ${err.message}`);
//   }
// }

async function getPendingMessages(deviceId: string) {
    return await prisma.message.findMany({
        where: { deviceId, deliveryStatus: 'pending' },
        select: {
            category: true,
            topic: true,
            payload: true,
        },
    });
}

async function acknowledgeMessage(deviceId: string, category: string) {
    try {
        await prisma.message.updateMany({
            where: {
                deviceId,
                category: category as MessageCategory,
            },
            data: {
                deliveryStatus: 'acknowledged',
            },
        });
        logger.info(`✅ Acknowledged message for ${deviceId}, category ${category}`);
    } catch (err: any) {
        logger.error(`❌ Acknowledge error: ${err.message}`);
    }
}

export async function publishMessage(topic: string, message: string, deviceId: string) {
    let category: string | null = null;
    if (topic.includes('wifi')) category = 'wifi';
    else if (topic.includes('subscription')) category = 'subscription';
    else {
        logger.warn(`Unknown topic type: ${topic}`);
        return false;
    }

    storeMessage(deviceId, category, topic, message);

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
    return publishMessage(topic, message, deviceId);
}

// Start publishing loop
(async function startPublisherLoop() {
    while (true) {
        await publishMessage('demo/topic', 'Hello from EMQX Cloud', 'device123');
        await sleep(5000);
    }
})();
