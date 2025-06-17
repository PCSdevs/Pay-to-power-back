import { RequestExtended } from '../interfaces/global';
import { deviceCategoryRepository } from '../repositories/deviceCategoryRepository';
import { deviceRepository } from '../repositories/deviceRepository';
import moment from 'moment-timezone';

const createDeviceCategory = async (req: RequestExtended) => {

	// await checkPermission(req.user.id, req.user.companyId, {
	// 	moduleName: 'Device Setup',
	// 	permission: ['create'],
	// });

	const { name, description } = req.body;

	const newCategory = await deviceCategoryRepository.createCategory({
		name,
		description,
		companyId: req.user.companyId,
	});

	return {
		data: newCategory,
		message: 'Device category created successfully.',
	};
};

const listDeviceCategories = async (req: RequestExtended) => {

	// await checkPermission(req.user.id, req.user.companyId, {
	// 	moduleName: 'Device Setup',
	// 	permission: ['view'],
	// });

	const categories = await deviceCategoryRepository.getAllCategories(req.user.companyId);

	return {
		data: categories,
		message: 'Device categories fetched successfully.',
	};
};

const registerDevice = async (req: RequestExtended) => {
	const {
		mac_address,
		name,
		category_id,
		wifi_ssid,
		wifi_password,
		office_id,
	} = req.body;

	// Check if category exists
	const category = await deviceCategoryRepository.getCategoryById(category_id);
	if (!category) {
		throw { statusCode: 404, message: 'Device category not found' };
	}

	// Check for existing device by MAC
	const existingDevice = await deviceRepository.getDeviceByMac(mac_address);

	if (existingDevice) {
		throw { statusCode: 400, message: 'Device already registered' };
	}

	// Create device
	const newDevice = await deviceRepository.createDevice({
		macAddress: mac_address,
		name,
		categoryId: category_id,
		officeId: office_id,
		wifiSsid: wifi_ssid,
		wifiPassword: wifi_password,
		companyId: req.user.companyId,
		userId: req.user.id, // required
		// connectionid: optional if you have it
	});


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
	const existingDevice = await deviceRepository.getDeviceById(deviceId);
  
	if (!existingDevice) {
	  throw { statusCode: 404, message: 'Device not found' };
	}
  
	const updatedDevice = await deviceRepository.updateDevice(deviceId, updateData);
  
	if (updateData.wifiSsid || updateData.wifiPassword) {
	  const mqttPayload = {
		device_id: deviceId,
		mac_address: existingDevice.macAddress,
		wifi_ssid: updateData.wifiSsid,
		wifi_password: updateData.wifiPassword,
		office_id: updateData.officeId,
		status: 'WiFi credentials updated',
	  };
  
	  const mqttTopic = `devices/${deviceId}/wifi`;
	//   await publishMessage(mqttTopic, JSON.stringify(mqttPayload), deviceId);
	}
  
	return {
	  data: updatedDevice,
	  message: 'Device updated successfully.',
	};
  };
  

  const getAllDevices = async (req: RequestExtended) => {
	const devices = await deviceRepository.getAllDevices(req?.user?.companyId);
  
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
export const deviceService = {
	createDeviceCategory,
	listDeviceCategories,
	registerDevice,
	updateDevice,
	getAllDevices
};
