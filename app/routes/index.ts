import express from "express";
import asyncHandler from "../utils/async-handler";
import { customError, notFound } from "../utils/errorHandler";
import authRoutes from "./authRoutes";
import permissionRoutes from "./permissionRoutes";
import roleRoutes from "./roleRoutes";
import userRoutes from "./userRoutes";
import companyRoutes from "./companyRoutes";
import deviceRoutes from "./deviceRoutes";
import subcriptionRoutes from "./subscriptionRoutes";

const router = express.Router();

// router.use('/api/auth', authRoutes);

router.use('/api/auth', authRoutes);
router.use('/api/user', userRoutes);
router.use('/api/role', roleRoutes);
router.use('/api/company', companyRoutes);
router.use('/api/permission', permissionRoutes);
router.use('/api/devices', deviceRoutes);
router.use('/api/subscriptions', subcriptionRoutes);

router.use(
  "/health",
  asyncHandler(async () => {
    return {
      message: "Hello from Serviots BackEnd",
    };
  }),
);

router.use(notFound);
router.use(customError);

export default router;
