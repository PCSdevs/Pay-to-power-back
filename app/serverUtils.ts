// src/server.ts
import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import { prisma } from './client/prisma';
import { setTimeout as sleep } from 'timers/promises';
import { MessageCategory } from '@prisma/client';
import { deviceRepository } from './repositories/deviceRepository';
import { userRepository } from './repositories/userRepository';

const EMQX_ENDPOINT = 'hb778060.ala.dedicated.aws.emqxcloud.com';
const EMQX_PORT = 8883;
const CA_PATH = path.resolve(__dirname, './certs/emqxcloud-ca.crt');

const options: mqtt.IClientOptions = {
    host: EMQX_ENDPOINT,
    port: EMQX_PORT,
    protocol: 'mqtts',
    username: 'pay2power',
    password: 'pay2power',
    clientId: 'backend-logger-01',
    ca: fs.readFileSync(CA_PATH),
    rejectUnauthorized: true,
};

// const options: mqtt.IClientOptions = {
//     host: 'test.mosquitto.org',
//     port: 1883,
//     protocol: 'mqtt',
//   };

const client = mqtt.connect(options);

// client.on('connect', () => {
//     logger.info('✅ Connected to EMQX Cloud MQTT broker');


//     // Subscribing to system topic to detect when devices connect
//     client.subscribe('$SYS/brokers/+/clients/+/connected', (err) => {
//         if (err) {
//             logger.error('❌ Failed to subscribe to connection events');
//         } else {
//             logger.info('📡 Subscribed to client connection events');
//         }
//     });



//     // ✅ Subscribe to devices/register topic
//     client.subscribe('devices/register', (err) => {
//         if (err) {
//             logger.error('❌ Failed to subscribe to devices/register');
//         } else {
//             logger.info('📡 Subscribed to devices/register');
//         }
//     });
// });

// client.on('error', (error: any) => {
//     logger.error(`❌ MQTT Error: ${error.message}`);
// });

// client.on('message', async (topic: any, payload: any) => {
//     console.log("🚀 ~ client.on ~ payload:", payload)
//     const data = JSON.parse(payload.toString())

//     // ✅ Handle system topic for device connection
//     if (topic.includes('/connected')) {
//         const clientId = topic.split('/')[5]; // $SYS/brokers/+/clients/{clientId}/connected
//         console.log(`🔌 Device connected: ${clientId}`);
//         return;
//     }



//     if (topic === 'devices/register') {
//         const { macAddress, name, apiKey } = data;
//         console.log("🚀 ~ client.on ~ macAddress:", macAddress)
//         console.log("🚀 ~ client.on ~ secretKey:", apiKey)
//         console.log("🚀 ~ client.on ~ name:", name)

//         const superuser = await userRepository.getSuperUser();

//         const newDevice = await deviceRepository.createDevice({
//             macAddress,
//             name,
//             // wifiSsid,
//             // wifiPassword,
//             // companyId: user.companyId,
//             userId: superuser!,
//         });

//         const mqttPayload = {
//             deviceId: newDevice.id,
//             macAddress: newDevice.macAddress,
//             // wifiSsid: newDevice.wifiSsid,
//             // wifiPassword: newDevice.wifiPassword,
//             secrectkey: newDevice.secrectkey,
//             status: 'WiFi credentials updated',
//         };

//         const mqttTopic = `devices/register`;
//         await publishMessage(mqttTopic, JSON.stringify(mqttPayload), newDevice.id);

//     }
//     try {
//         const data = JSON.parse(payload.toString());
//         if (data.type === 'acknowledge') {
//             const { device_id, category } = data;
//             if (device_id && category) {
//                 await acknowledgeMessage(device_id, category);
//             }
//         }
//     } catch (err: any) {
//         logger.error(`❌ Error processing message: ${err.message}`);
//     }
// });


client.on('connect', () => {
    logger.info('✅ Connected to EMQX Cloud MQTT broker');

    // Subscribe to connection status system topic
    client.subscribe('$SYS/brokers/+/clients/+/connected', (err) => {
        if (err) {
            logger.error('❌ Failed to subscribe to connection events');
        } else {
            logger.info('📡 Subscribed to client connection events');
        }
    });

    // Subscribe to registration topic
    client.subscribe('devices/register', (err) => {
        if (err) {
            logger.error('❌ Failed to subscribe to devices/register');
        } else {
            logger.info('📡 Subscribed to devices/register');
        }
    });
});

client.on('error', (error: any) => {
    logger.error(`❌ MQTT Error: ${error.message}`);
});

client.on('message', async (topic: string, payload: Buffer) => {
    const rawPayload = payload.toString();
    console.log("🚀 ~ client.on ~ rawPayload:", rawPayload)
    let data: any;

    // Try parsing the message safely
    try {
        data = JSON.parse(rawPayload);
    } catch (err: any) {
        console.log("🚀 ~ client.on ~ err:", err)
        logger.warn(`⚠️ Skipping non-JSON message on topic ${topic}`);
        return;
    }

    // Handle system topic: device connection
    if (topic.includes('/connected')) {
        const clientId = topic.split('/')[5];
        logger.info(`🔌 Device connected: ${clientId}`);
        return;
    }

    // Handle device registration
    if (topic === 'devices/register') {
        const { macAddress, name, apiKey } = data;

        // if (!macAddress || !name || !apiKey) {
        //     logger.warn('❌ Incomplete registration payload');
        //     return;
        // }

        logger.info(`📥 Registering device: ${macAddress} - ${name}`);

        const superuser = await userRepository.getSuperUser();

        const newDevice = await deviceRepository.createDevice({
            macAddress,
            userId: superuser!,
        });

        const mqttPayload = {
            deviceId: newDevice.id,
            macAddress: newDevice.macAddress,
            secrectkey: newDevice.secrectkey,
            status: 'WiFi credentials updated',
        };

        // ⚠️ Use a different topic to respond to the device
        const responseTopic = `devices/register`;
        await publishMessage(responseTopic, JSON.stringify(mqttPayload), newDevice.id);
    }

    // Handle acknowledgment messages
    if (data.type === 'acknowledge') {
        const { device_id, category } = data;
        if (device_id && category) {
            await acknowledgeMessage(device_id, category);
        }
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
    // if (topic.includes('wifi')) category = 'wifi';
    // else if (topic.includes('subscription')) category = 'subscription';
    // else {
    //     logger.warn(`Unknown topic type: ${topic}`);
    //     return false;
    // }

    // storeMessage(deviceId, category!, topic, message);

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
// (async function startPublisherLoop() {
//     while (true) {
//         await publishMessage('demo/topic', 'Hello from EMQX Cloud', 'device123');
//         await sleep(5000);
//     }
// })();
