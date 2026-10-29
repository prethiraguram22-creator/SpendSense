import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/auth.schema.js';

const router = Router();
router.use(requireAuth);

// PATCH /api/user/profile
router.patch('/profile', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { name, currency, monthlyIncomeTarget } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (currency !== undefined) updateData.currency = currency;
    if (monthlyIncomeTarget !== undefined) updateData.monthlyIncomeTarget = monthlyIncomeTarget;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        monthlyIncomeTarget: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: serializeModel(updated),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/user/notifications
router.patch('/notifications', async (req, res, next) => {
  try {
    const { budgetAlerts, overrunPredictions, weeklyReport, goalMilestones } = req.body;

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: req.user.id },
      update: {
        ...(budgetAlerts !== undefined ? { budgetAlerts } : {}),
        ...(overrunPredictions !== undefined ? { overrunPredictions } : {}),
        ...(weeklyReport !== undefined ? { weeklyReport } : {}),
        ...(goalMilestones !== undefined ? { goalMilestones } : {}),
      },
      create: {
        userId: req.user.id,
        budgetAlerts: budgetAlerts ?? true,
        overrunPredictions: overrunPredictions ?? true,
        weeklyReport: weeklyReport ?? true,
        goalMilestones: goalMilestones ?? true,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user/change-password
router.post('/change-password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password does not match our records.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user/account
router.delete('/account', async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.clearCookie('spendsense_token');

    return res.json({
      success: true,
      message: 'Your account and all associated financial records have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

