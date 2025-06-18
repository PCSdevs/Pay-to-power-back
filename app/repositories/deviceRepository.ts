import { prisma } from '../client/prisma';

const getDeviceByMac = async (macAddress: string) => {
    return await prisma.device.findUnique({
        where: { macAddress },
    });
};

const createDevice = async (data: {
    macAddress: string;
    name: string;
    wifiSsid?: string;
    wifiPassword?: string;
    companyId?: string;
    userId: string; 
}) => {
    return await prisma.device.create({
        data:data
    });
};

const getDeviceById = async (id: string) => {
    return await prisma.device.findUnique({
        where: { id },
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

  const getAllDevices = async (companyId: string, isSuperAdmin: boolean) => {
    return await prisma.device.findMany({
      where: isSuperAdmin ? {} : { companyId },
      include:{
        company:true
      }
    });
  };
  const assignCompanyToDevice = async (
    deviceId: string,
    companyId: any
  ) => {

    return await prisma.device.update({
      where: { id:deviceId },
      data: {
        companyId:companyId
      },
    });
  };

export const deviceRepository = {
    getDeviceByMac,
    createDevice,
    getDeviceById,
    updateDevice,
    getAllDevices,
    assignCompanyToDevice
};
