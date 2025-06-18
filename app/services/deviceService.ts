import { RequestExtended } from '../interfaces/global';
import { deviceRepository } from '../repositories/deviceRepository';
import moment from 'moment-timezone';
import { publishMessage } from '../serverUtils';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';
import { checkPermission } from '../middlewares/isAuthorizedUser';


const registerDevice = async (req: RequestExtended) => {

	const { user } = req
	await checkPermission(user.id, user.companyId, {
		moduleName: 'Device',
		permission: ['add'],
	});

	const {
		macAddress,
		name,
		// wifiSsid,
		// wifiPassword,
	} = req.body;


	const existingDevice = await deviceRepository.getDeviceByMac(macAddress);

	if (existingDevice) {
		throw new ApiException(ErrorCodes.DEVICE_ALREADY_REGISTER)
	}

	const newDevice = await deviceRepository.createDevice({
		macAddress,
		name,
		// wifiSsid,
		// wifiPassword,
		// companyId: user.companyId,
		userId: user.id,
	});

	const mqttPayload = {
		deviceId: newDevice.id,
		macAddress: newDevice.macAddress,
		// wifiSsid: newDevice.wifiSsid,
		// wifiPassword: newDevice.wifiPassword,
		secrectkey: newDevice.secrectkey,
		status: 'WiFi credentials updated',
	};

	const mqttTopic = `devices/${newDevice.id}/wifi`;
	await publishMessage(mqttTopic, JSON.stringify(mqttPayload), newDevice.id);


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
		throw { statusCode: 404, message: 'Device not found' };
	}

	const updateDeviceData = {
		macAddress: updateData.macAddress,
		name: updateData?.name,
		// categoryId: category_id,
		// officeId: office_id,
		wifiSsid: updateData.wifiSsid,
		wifiPassword: updateData.wifiPassword,
		companyId: req.user.companyId,
		userId: req.user.id, // required
		// connectionid: optional if you have it
	}


	const updatedDevice = await deviceRepository.updateDevice(deviceId, updateDeviceData);

	if (updateData.wifiSsid || updateData.wifiPassword) {
		const mqttPayload = {
			device_id: deviceId,
			macAddress: existingDevice.macAddress,
			wifiSsid: updateData.wifiSsid,
			wifiPassword: updateData.wifiPassword,
			status: 'WiFi credentials updated',
		};

		const mqttTopic = `devices/${deviceId}/wifi`;
		await publishMessage(mqttTopic, JSON.stringify(mqttPayload), deviceId);
	}

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

	const sanitizedDevices = devices.map((device) => {
		const { wifiSsid, wifiPassword, ...safeData } = device;
		return {
			...safeData,
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
		permission: ['add','edit'],
	});

	const {
		deviceId,
		comapnyId
	} = req.body;


	const existingDevice = await deviceRepository.getDeviceById(deviceId);

	if (!existingDevice) {
		throw new ApiException(ErrorCodes.INVALID_DEVICE_ID)
	}

	const newDevice = await deviceRepository.assignCompanyToDevice(deviceId,comapnyId);

	return {
		data: newDevice,
		message: 'Device assigned successfully.',
	};

}
export const deviceService = {
	registerDevice,
	updateDevice,
	getAllDevices,
	assignCompanyToDevice
};
