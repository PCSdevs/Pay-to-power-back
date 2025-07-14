import { RequestExtended } from '../interfaces/global';
import { deviceRepository } from '../repositories/deviceRepository';
import moment from 'moment-timezone';
import { publishMessage, storeMessage } from '../serverUtils';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { checkPermission } from '../middlewares/isAuthorizedUser';
import { userRepository } from '../repositories/userRepository';
import { comparePassword } from '../helpers/passwordHelper';


const registerDevice = async (req: RequestExtended) => {

	const { user } = req
	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['add'],
	});

	const {
		macAddress,
		boardNumber,
		// wifiSsid,
		// wifiPassword,
	} = req.body;


	const existingDevice = await deviceRepository.getDeviceByMac(macAddress);

	if (existingDevice) {
		throw new ApiException(ErrorCodes.DEVICE_ALREADY_REGISTER)
	}

	const newDevice = await deviceRepository.createDevice({
		macAddress,
		boardNumber,
		userId: user.id,
	});

	const mqttPayload = {
		deviceId: newDevice.generatedDeviceId,
		macAddress: newDevice.macAddress,
		secreteKey: newDevice.secreteKey,
		status: 'Device register successfully.',
		code: 200,
		source: 'server'
	};
	storeMessage(newDevice?.id, `device/${newDevice.generatedDeviceId}/wifi`, JSON.stringify(mqttPayload))

	await publishMessage(`device/${newDevice?.generatedDeviceId}/online`, JSON.stringify({ checkingConnection: "isDeviceOnline", source: 'server' }));


	return {
		data: newDevice,
		message: 'Device registered successfully.',
	};

}

const updateDevice = async (
	req: RequestExtended,
	deviceId: string,
	updateData: any
) => {

	const { user } = req
	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['edit'],
	});

	const existingDevice = await deviceRepository.getDeviceById(deviceId);

	if (!existingDevice) {
		throw new ApiException(ErrorCodes.DEVICE_NOT_FOUND)
	}

	const updateDeviceData = {
		macAddress: updateData.macAddress,
		name: updateData?.name,
		companyId: req.user.companyId,
		userId: req.user.id,
	}


	const updatedDevice = await deviceRepository.updateDevice(deviceId, updateDeviceData);

	// if (updateData.wifiSsid || updateData.wifiPassword) {
	// 	const mqttPayload = {
	// 		deviceId: updatedDevice?.generatedDeviceId,
	// 		macAddress: existingDevice.macAddress,
	// 		status: 'WiFi credentials updated',
	// 		code:200
	// 	};

	// 	const mqttTopic = `device/${deviceId}/wifi`;
	// 	await publishMessage(mqttTopic, JSON.stringify(mqttPayload), updatedDevice.id);
	// }

	return {
		data: updatedDevice,
		message: 'Device updated successfully.',
	};
};


const getAllDevices = async (req: RequestExtended) => {
	const { user } = req

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['view'],
	});

	const { isSuperAdmin } = user
	const devices = await deviceRepository.getAllDevices(user?.companyId, isSuperAdmin);

	const currentTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

	// const sanitizedDevices = devices.map((device) => {
	// 	return {
	// 		...device,
	// 		current_time: currentTime,
	// 	};
	// });
	const sanitizedDevices = devices.map((device) => {
		const {
			hotspotId,
			hotspotPassword,
			clientId,
			clientPassword,
			adminId,
			adminPassword,
			...rest
		} = device;

		return {
			...rest,
			current_time: currentTime,
		};
	});

	return {
		data: sanitizedDevices,
		message: 'Devices fetched successfully',
	};
};

const assignCompanyToDevice = async (req: RequestExtended) => {
	const { user } = req
	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['add', 'edit'],
	});

	const {
		deviceIds,
		companyId
	} = req.body;

	if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
		throw new ApiException(ErrorCodes.BAD_REQUEST);
	}

	const results: any[] = [];


	for (const deviceId of deviceIds) {
		const existingDevice = await deviceRepository.getDeviceById(deviceId);
		if (!existingDevice) {
			throw new ApiException(ErrorCodes.INVALID_DEVICE_ID);
		}

		const updatedDevice = await deviceRepository.assignCompanyToDevice(deviceId, companyId);
		results.push(updatedDevice);
	}
	return {
		data: results,
		message: 'Device assigned successfully.',
	};

}

const addClientModeToDevice = async (req: RequestExtended) => {
	const { user } = req
	const { deviceId, hotspotId, hotspotPassword, clientId, clientPassword, adminId, adminPassword } = req.body

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['edit'],
	});

	// const { isSuperAdmin } = user

	//need to hash or not   ??

	const deviceData = await deviceRepository.updateDevice(deviceId, { hotspotId, hotspotPassword, clientId, clientPassword, adminId, adminPassword })

	const mqttPayload = {
		apId: deviceData.hotspotId,
		apPass: deviceData.hotspotPassword,
		clientId: deviceData.clientId,
		clientPass: deviceData.clientPassword,
		adminId: deviceData.adminId,
		adminPass: deviceData.adminPassword,
		status: 'Device clientMode ON successfully.',
		code: 200,
		source: 'server'
	};

	storeMessage(deviceId, `device/${deviceData.generatedDeviceId}/clientMode`, JSON.stringify(mqttPayload))

	await publishMessage(`device/${deviceData?.generatedDeviceId}/online`, JSON.stringify({ checkingConnection: "isDeviceOnline", source: 'server' }));

	return {
		data: deviceData,
		message: 'Devices updated successfully',
	};
};

const validateAdminPassForDevice = async (req: RequestExtended) => {
	const { user } = req

	const { deviceId, adminPassword } = req?.body

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['view'],
	});

	const userData = await userRepository.getUserByIdAndCompanyId(user?.id, user?.companyId)

	if (!userData) {
		throw new ApiException(ErrorCodes.USER_NOT_FOUND)
	}

	if (!(user?.isAdmin || user?.isSuperAdmin)) {
		throw new ApiException(ErrorCodes?.MISSING_PERMISSION)
	}


	const isPasswordValid = await comparePassword(
		adminPassword,
		userData.password as string
	);

	if (!isPasswordValid) {
		throw new ApiException(ErrorCodes.INVALID_CREDENTIALS);
	}


	const deviceData = await deviceRepository.getDeviceById(deviceId)

	if (!deviceData) {
		throw new ApiException(ErrorCodes?.DEVICE_NOT_FOUND)
	}


	return {
		data: deviceData,
		message: 'Password validated successfully',
	};
};

const changeWifiForDevice = async (req: RequestExtended) => {
	const { user } = req
	const { deviceId, wifiSsid, wifiPassword } = req.body

	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['edit'],
	});

	const existingDevice = await deviceRepository.getDeviceById(deviceId);
	if (!existingDevice) {
		throw new ApiException(ErrorCodes.INVALID_DEVICE_ID);
	}

	const deviceData = await deviceRepository.updateDevice(deviceId, { wifiSsid, wifiPassword })
	//NOTE - update the naming of this (hotspotName and hotspotNamePass)  and the store message

	const mqttPayload = {
		wifi_ssid: deviceData?.wifiSsid,
		wifi_password: deviceData?.wifiPassword,
		status: 'Device hotspot changed successfully.',
		code: 200,
		source: 'server'
	};
	storeMessage(deviceId, `device/${deviceData.generatedDeviceId}/wifi`, JSON.stringify(mqttPayload))

	await publishMessage(`device/${deviceData?.generatedDeviceId}/online`, JSON.stringify({ checkingConnection: "isDeviceOnline", source: 'server' }));

	return {
		data: deviceData,
		message: 'Devices updated successfully',
	};
}

export const deviceService = {
	registerDevice,
	updateDevice,
	getAllDevices,
	assignCompanyToDevice,
	addClientModeToDevice,
	validateAdminPassForDevice,
	changeWifiForDevice
};
