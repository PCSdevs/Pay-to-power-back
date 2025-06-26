import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
// import { deviceService } from '../services/deviceService';
import { RequestExtended } from '../interfaces/global';
import { deviceService } from '../services/deviceService';
import { assignCompanyToDevicesValidationRules, hotspotDeviceValidationRules } from '../helpers/validators';

const router = express.Router();

router.post(
  '/register',
  isAuthenticated,
  asyncHandler(async (req: RequestExtended, res) => {
    const result = await deviceService.registerDevice(req);
    return result;
  })
);

router.post(
  '/assign-company',
  isAuthenticated,
  assignCompanyToDevicesValidationRules,
  asyncHandler(async (req: RequestExtended, res) => {
    const result = await deviceService.assignCompanyToDevice(req);
    return result;
  })
);

router.put(
  '/:deviceId',
  isAuthenticated,
  asyncHandler(async (req: RequestExtended, res) => {
    const { deviceId } = req.params;
    const updateData = req.body;

    const result = await deviceService.updateDevice(req, deviceId, updateData);
    return result;
  })
);

router.get(
  '/',
  isAuthenticated,
  asyncHandler(async (req: RequestExtended, res) => {
    const result = await deviceService.getAllDevices(req);
    res.json(result);
  })
);

router.post(
  '/client-mode',
  isAuthenticated,
  hotspotDeviceValidationRules,
  asyncHandler(async (req: RequestExtended, res) => {
    const result = await deviceService.addClientModeToDevice(req);
    res.json(result);
  })
);

export default router;