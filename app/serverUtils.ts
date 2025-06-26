// import fs from 'fs';
// import mqtt from 'mqtt';
// import path from 'path';
// import { prisma } from './client/prisma';
// import { deviceRepository } from './repositories/deviceRepository';
// import { userRepository } from './repositories/userRepository';
// import { logger } from './utils/logger';

// const EMQX_ENDPOINT = 'hb778060.ala.dedicated.aws.emqxcloud.com';
// const EMQX_PORT = 8883;
// const CA_PATH = path.resolve(__dirname, './certs/emqxcloud-ca.crt');

// const options: mqtt.IClientOptions = {
//     host: EMQX_ENDPOINT,
//     port: EMQX_PORT,
//     protocol: 'mqtts',
//     username: 'pay2power',
//     password: 'pay2power',
//     clientId: 'backend-logger-01',
//     ca: fs.readFileSync(CA_PATH),
//     rejectUnauthorized: true,
// };

// const client = mqtt.connect(options);

// client.on('connect', () => {
//     logger.info('✅ Connected to EMQX Cloud MQTT broker');

//     // Subscribe to connection status system topic
//     // client.subscribe('$SYS/brokers/+/clients/+/connected', (err) => {
//     //     if (err) {
//     //         logger.error('❌ Failed to subscribe to connection events');
//     //     } else {
//     //         logger.info('📡 Subscribed to client connection events');
//     //     }
//     // });

//     // // Subscribe to registration topic
//     // client.subscribe('device/register', (err) => {
//     //     if (err) {
//     //         logger.error('❌ Failed to subscribe to device/register');
//     //     } else {
//     //         logger.info('📡 Subscribed to device/register');
//     //     }
//     // });

//     client.subscribe('device/+/+', (err) => {
//         if (err) {
//             logger.error('❌ Failed to subscribe to device/');
//         } else {
//             logger.info('📡 Subscribed to device/');
//         }
//     });


//     client.subscribe('device/+', (err) => {
//         if (err) {
//             logger.error('❌ Failed to subscribe to device/');
//         } else {
//             logger.info('📡 Subscribed to device/');
//         }
//     });

//     client.subscribe('device/+/+');

// });

// client.on('error', (error: any) => {
//     logger.error(`❌ MQTT Error: ${error.message}`);
// });

// client.on('message', async (topic: string, payload: Buffer) => {
//     const rawPayload = payload.toString();
//     console.log("🚀 ~ client.on ~ rawPayload:", rawPayload)
//     let data: any;

//     // Try parsing the message safely
//     try {
//         data = JSON.parse(rawPayload);
//     } catch (err: any) {
//         console.log("🚀 ~ client.on ~ err:", err)
//         logger.warn(`⚠️ Skipping non-JSON message on topic ${topic}`);
//         return;
//     }

//     if (data?.source === 'server') return;
//     console.log("🚀 ~ client.on ~ parse data:", data)



//     // Handle system topic: device connection
//     if (topic.includes('/connected')) {
//         const clientId = topic.split('/')[5];
//         logger.info(`🔌 Device connected: ${clientId}`);
//         return;
//     }

//     const onlineMatch = topic.match(/^device\/([^/]+)\/online$/);
//     if (onlineMatch) {
//         const deviceId = onlineMatch[1];
//         logger.info(`📶 Device is online: ${deviceId}`);

//         const deviceData= await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId)

//         if(!deviceData){
//             const mqttPayload = {
//                 code: 401,
//                 status: 'device not found.',
//                 source: 'server'
//             };

//             const responseTopic = `device/error`;
//             await publishMessage(responseTopic, JSON.stringify(mqttPayload));
//             return

//         }

//         const messages = await prisma.message.findFirst({
//             where: {
//                 deviceId:deviceData.id,
//                 deliveryStatus: 'PENDING',
//             },
//         });
//         if (messages) {
//             const deviceData = await deviceRepository.getDeviceById(messages?.deviceId)

//             await publishMessage(messages?.topic, JSON.stringify({
//                 ...JSON.parse(messages?.payload),
//                 source: 'server',
//               }));
//         }
//     }

//     const acknowledgedMatch = topic.match(/^device\/([^/]+)\/acknowledge$/);
//     if (acknowledgedMatch) {
//         const deviceId = acknowledgedMatch[1]; // dynamic value
//         logger.info(`📶 Device is online: ${deviceId}`);


//         const { topic } = data;

//         const deviceData= await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId)

//         const sentMessage=  await prisma?.message?.findFirst({
//             where:{
//                 deviceId:deviceData?.id,
//                 topic,
//                 deliveryStatus:"PENDING"

//             }
//         })

//         if(sentMessage){
//             await prisma.message?.update({
//                 where:{
//                     id:sentMessage.id
//                 },
//                 data:{
//                     deliveryStatus:'ACKNOWLEDGED'
//                 }
//             })
//         }

//         const messages = await prisma.message.findFirst({
//             where: {
//                 deviceId:deviceData?.id,
//                 deliveryStatus: 'PENDING',
//             },
//         });
//         if (messages) {
//             const parsedPayload = JSON.parse(messages?.payload || '{}');

//             await publishMessage(messages?.topic, JSON.stringify({...parsedPayload,source:'server'}));
//         }
//     }


//     // Handle device registration
//     if (topic === 'device/register') {
//         const { macAddress, boardNumber } = data;

//         logger.info(`📥 Registering device: ${macAddress}`);

//         const superuser = await userRepository.getSuperUser();

//         const isDeviceExits = await deviceRepository.getDeviceByMac(macAddress)

//         if (isDeviceExits) {
//             const mqttPayload = {
//                 code: 401,
//                 status: 'device with same macAddress already registered.',
//                 source:'server'
//             };

//             const responseTopic = `device/register`;
//             await publishMessage(responseTopic, JSON.stringify(mqttPayload));
//             return
//         }

//         const newDevice = await deviceRepository.createDevice({
//             macAddress,
//             boardNumber,
//             userId: superuser as string,
//         });

//         const mqttPayload = {
//             deviceId: newDevice.generatedDeviceId,
//             macAddress: newDevice.macAddress,
//             secreteKey: newDevice.secreteKey,
//             status: 'Device register successfully.',
//             code: 200,
//             source:'server'
//         };

//         // ⚠️ Use a different topic to respond to the device
//         const responseTopic = `device/register`;
//         await publishMessage(responseTopic, JSON.stringify(mqttPayload));
//     }

//     // Handle acknowledgment messages
//     if (data.type === 'acknowledge') {
//         const { device_id, category } = data;
//         if (device_id && category) {
//             await acknowledgeMessage(device_id, topic);
//         }
//     }
// });


// export async function storeMessage(
//     deviceId: string,
//     topic: string,
//     payload: string
// ) {
//     try {
//         const deliveryStatus = 'PENDING';

//         const existing = await prisma.message.findFirst({
//             where: {
//                 deviceId: deviceId,
//                 topic: topic,
//                 deliveryStatus,
//             },
//         });

//         if (existing) {
//             return await prisma.message.update({
//                 where: { id: existing.id },
//                 data: {
//                     payload: payload,
//                     timestamp: new Date(),
//                 },
//             });
//         } else {
//             return await prisma.message.create({
//                 data: {
//                     deviceId: deviceId,
//                     topic: topic,
//                     payload: payload,
//                     deliveryStatus,
//                 },
//             });
//         }
//     } catch (err: any) {
//         logger.error(`❌ Failed to store message: ${err.message}`);
//     }
// }

// async function getPendingMessages(deviceId: string) {
//     return await prisma.message.findMany({
//         where: { deviceId, deliveryStatus: 'PENDING' },
//         select: {
//             topic: true,
//             payload: true,
//         },
//     });
// }

// async function acknowledgeMessage(deviceId: string, topic: string) {
//     try {
//         await prisma.message.updateMany({
//             where: {
//                 deviceId,
//                 topic: topic,
//             },
//             data: {
//                 deliveryStatus: 'ACKNOWLEDGED',
//             },
//         });
//         logger.info(`✅ Acknowledged message for ${deviceId}, category ${topic}`);
//     } catch (err: any) {
//         logger.error(`❌ Acknowledge error: ${err.message}`);
//     }
// }

// export async function publishMessage(topic: string, message: string) {

//     // if (deviceId) {
//     //     storeMessage(deviceId, topic, message);

//     // }
//     client.publish(topic, message, {}, (err: any) => {
//         if (err) logger.error(`❌ Publish failed: ${err.message}`);
//         else logger.info(`📤 Sent '${message}' to topic '${topic}'`);
//     });

//     return true;
// }

// export async function publishMessageWithIST(
//     topic: string,
//     payload: Record<string, any>,
//     deviceId: string
// ) {
//     const now = new Date().toLocaleString('en-IN', {
//         timeZone: 'Asia/Kolkata',
//         hour12: false,
//     });
//     payload.timestamp_ist = now;
//     const message = JSON.stringify(payload);
//     return publishMessage(topic, message);
// }

// // Start publishing loop
// // (async function startPublisherLoop() {
// //     while (true) {
// //         await publishMessage('demo/topic', 'Hello from EMQX Cloud', 'device123');
// //         await sleep(5000);
// //     }
// // })();



import fs from 'fs';
import mqtt from 'mqtt';
import path from 'path';
import os from 'os';
import { prisma } from './client/prisma';
import { deviceRepository } from './repositories/deviceRepository';
import { userRepository } from './repositories/userRepository';
import { logger } from './utils/logger';

const EMQX_ENDPOINT = 'hb778060.ala.dedicated.aws.emqxcloud.com';
const EMQX_PORT = 8883;
const CA_PATH = path.resolve(__dirname, './certs/emqxcloud-ca.crt');

const options: mqtt.IClientOptions = {
    host: EMQX_ENDPOINT,
    port: EMQX_PORT,
    protocol: 'mqtts',
    username: 'pay2power',
    password: 'pay2power',
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
    console.log("🚀 ~ client.on ~ rawPayload:", rawPayload);
    let data: any;

    try {
        data = JSON.parse(rawPayload);
    } catch (err: any) {
        console.log("🚀 ~ client.on ~ err:", err);
        logger.warn(`⚠️ Skipping non-JSON message on topic ${topic}`);
        return;
    }

    if (data?.source === 'server') return;
    console.log("🚀 ~ client.on ~ parse data:", data);

    // if (topic.includes('/connected')) {
    //     const clientId = topic.split('/')[5];
    //     logger.info(`🔌 Device connected: ${clientId}`);
    //     return;
    // }

    const onlineMatch = topic.match(/^device\/([^/]+)\/online$/);
    if (onlineMatch) {
        const deviceId = onlineMatch[1];
        logger.info(`📶 Device is online: ${deviceId}`);

        const deviceData = await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId);
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

        const { topic } = data;

        const deviceData = await deviceRepository?.getDeviceByGeneratedDeviceId(deviceId);
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
