import { Prisma } from '@prisma/client';
import { prisma } from '../client/prisma';
import { generate7CharKey, generateUnique3CharId } from '../utils/utils';

const getDeviceByMac = async (macAddress: string) => {
  return await prisma.device.findUnique({
    where: { macAddress },
  });
};

const createDevice = async (data: {
  macAddress: string;
  boardNumber: string;
  userId: string; // required
}) => {

  const generatedDeviceId = await generateUnique3CharId();
  const secreteKey = generate7CharKey();

  return await prisma.device.create({
    data: {
      macAddress: data.macAddress,
      boardNumber:data.boardNumber,
      userId: data.userId,
      generatedDeviceId:generatedDeviceId ,
      secreteKey:secreteKey,
    } as Prisma.DeviceUncheckedCreateInput,
  });
};


const getDeviceById = async (id: string) => {
  return await prisma.device.findUnique({
    where: { id },
  });
};

const getDeviceByGeneratedDeviceId = async (id: string) => {
  return await prisma.device.findUnique({
    where: { generatedDeviceId: id },
  });
};

const updateDevice = async (
  id: string,
  data: any
) => {
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return await prisma.device.update({
    where: { id },
    data: filteredData,
  });
};

const getAllDevicesWithSubscriptions = async (companyId: string) => {
  return await prisma.device.findMany({
    where: { companyId },
    include: {
      subscriptions: true
    }
  });
};

const getAllDevices = async (companyId: string, isSuperAdmin: boolean) => {
  return await prisma.device.findMany({
    where: isSuperAdmin ? {} : { companyId },
    include: {
      company: true
    }
  });
};


const assignCompanyToDevice = async (
  deviceId: string,
  companyId: any
) => {

  return await prisma.device.update({
    where: { id: deviceId },
    data: {
      companyId: companyId
    },
  });
};

const validateAdminPassForDevice = async (
  deviceId: string,
  adminPassword: any
) => {

  return await prisma.device.findUnique({
    where: { id: deviceId,
      adminPassword:adminPassword
     }

  });
};

export const deviceRepository = {
  getDeviceByMac,
  createDevice,
  getDeviceById,
  updateDevice,
  getAllDevices,
  assignCompanyToDevice,
  getAllDevicesWithSubscriptions,
  getDeviceByGeneratedDeviceId,
  validateAdminPassForDevice
};
