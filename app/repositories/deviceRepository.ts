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
    companyId: string;
    userId: string; 
}) => {
    return await prisma.device.create({
        // data: {
        //     macAddress: data.macAddress,
        //     name: data.name,
        //     wifiSsid: data.wifiSsid,
        //     wifiPassword: data.wifiPassword,
        //     companyId: data.companyId,
        //     userId: data.userId
        // },
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

  const getAllDevices = async (companyId:string) => {
    return await prisma.device.findMany({
        where:{
            companyId
        }
    });
  };

export const deviceRepository = {
    getDeviceByMac,
    createDevice,
    getDeviceById,
    updateDevice,
    getAllDevices
};
