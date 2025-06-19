import express from 'express';
import asyncHandler from '../utils/async-handler';
import { isAuthenticated } from '../middlewares/authMiddleware';
import { RequestExtended } from '../interfaces/global';
import { deviceSubscriptionService } from '../services/subscriptionService';

const router = express.Router();

router.post(
  '/create',
  isAuthenticated,
  asyncHandler(async (req: RequestExtended, res) => {
    const result = await deviceSubscriptionService.createSubscription(req);
    return result;
  })
);

router.put(
    '/:deviceId',
    isAuthenticated,
    asyncHandler(async (req: RequestExtended, res) => {
      const deviceId = req.params.deviceId;
      const updateData = req.body;
  
      const result = await deviceSubscriptionService.updateSubscription(deviceId, updateData, req.user);
      return result;
    })
  );

  router.get(
	'/',
	isAuthenticated,
	asyncHandler(async (req:RequestExtended, res) => {
		const result = await deviceSubscriptionService.getAllSubscriptions(req);
    return result;
	})
);


export default router;
