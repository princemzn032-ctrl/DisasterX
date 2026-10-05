import express from 'express';
import asyncHandler from 'express-async-handler';
import { body } from 'express-validator';
import EmergencyRequest from '../models/EmergencyRequest.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const validStatuses = ['sent', 'dispatched', 'resolved'];

router.get('/', protect, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' || req.user.role === 'rescue_team'
    ? {}
    : { userId: req.user._id };
  res.json(await EmergencyRequest.find(filter).populate('userId', 'name phone').sort({ createdAt: -1 }).limit(200));
}));

router.post('/',
  protect,
  body('lat').optional().isFloat({ min: -90, max: 90 }),
  body('lng').optional().isFloat({ min: -180, max: 180 }),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  validate,
  asyncHandler(async (req, res) => {
    const location = {
      address: req.body.location?.address || 'Location shared by device',
      lat: Number(req.body.lat ?? req.body.location?.lat),
      lng: Number(req.body.lng ?? req.body.location?.lng)
    };
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      res.status(400);
      throw new Error('A valid GPS location is required to send SOS');
    }
    const request = await EmergencyRequest.create({
      userId: req.user._id,
      location,
      emergencyType: req.body.emergencyType || 'Emergency SOS',
      severity: 'critical',
      status: 'sent'
    });
    const created = await request.populate('userId', 'name phone');
    req.app.get('io')?.emit('sos:new', created);
    res.status(201).json(created);
  })
);

const updateStatus = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  const request = await EmergencyRequest.findByIdAndUpdate(
    req.params.id,
    { status, ...(req.body.assignedTeam && { assignedTeam: req.body.assignedTeam }) },
    { new: true, runValidators: true }
  ).populate('userId', 'name phone');
  if (!request) {
    res.status(404);
    throw new Error('SOS request not found');
  }
  req.app.get('io')?.emit('sos:updated', request);
  res.json(request);
});

router.put('/:id/status', protect, admin, updateStatus);
router.put('/:id', protect, admin, updateStatus);

export default router;
