import { RequestExtended } from '../interfaces/global';
import { deviceRepository } from '../repositories/deviceRepository';
import moment from 'moment-timezone';
import { publishMessage } from '../serverUtils';
import ApiException from '../utils/errorHandler';
import { ErrorCodes } from '../utils/response';


const registerDevice = async (req: RequestExtended) => {

	const {user}= req
	const {
		macAddress,
		name,
		// wifiSsid,
		// wifiPassword,
		// office_id,
		// category_id,
	} = req.body;

	// Check if category exists
	// const category = await deviceCategoryRepository.getCategoryById(category_id);
	// if (!category) {
	// 	throw { statusCode: 404, message: 'Device category not found' };
	// }

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
		secrectkey:newDevice.secrectkey,
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
	const existingDevice = await deviceRepository.getDeviceById(deviceId);
  
	if (!existingDevice) {
	  throw { statusCode: 404, message: 'Device not found' };
	}

	const updateDeviceData={
		macAddress: updateData.macAddress,
		name:updateData?.name,
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
		// office_id: updateData.officeId,
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
	const {user}=req
	const {isSuperAdmin} =user
	const devices = await deviceRepository.getAllDevices(user?.companyId,isSuperAdmin);
  
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
	// createDeviceCategory,
	// listDeviceCategories,
	registerDevice,
	updateDevice,
	getAllDevices
};
