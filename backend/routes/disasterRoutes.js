import express from 'express';
import asyncHandler from 'express-async-handler';
import { body } from 'express-validator';
import Disaster from '../models/Disaster.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { imageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const locationFrom = (body) => ({
  address: body.address || body.location?.address,
  lat: Number(body.lat ?? body.location?.lat),
  lng: Number(body.lng ?? body.location?.lng)
});

router.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.severity) filters.severity = req.query.severity;
  if (req.query.status) filters.status = req.query.status;
  res.json(await Disaster.find(filters).populate('reportedBy', 'name').sort({ createdAt: -1 }).limit(200));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const incident = await Disaster.findById(req.params.id).populate('reportedBy', 'name');
  if (!incident) {
    res.status(404);
    throw new Error('Disaster not found');
  }
  res.json(incident);
}));

router.post('/',
  protect,
  imageUpload.array('images', 4),
  body('title').trim().isLength({ min: 4, max: 120 }).withMessage('Title must be between 4 and 120 characters'),
  body('type').isIn(['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'other']).withMessage('Choose a valid incident type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Choose a valid severity'),
  body('description').trim().isLength({ min: 10, max: 3000 }).withMessage('Description must be between 10 and 3000 characters'),
  body('address').trim().isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a number between -90 and 90').bail().toFloat(),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a number between -180 and 180').bail().toFloat(),
  validate,
  asyncHandler(async (req, res) => {
    const incident = await Disaster.create({
      title: req.body.title,
      type: req.body.type,
      severity: req.body.severity,
      description: req.body.description,
      location: locationFrom(req.body),
      affectedPeople: Math.max(0, Number(req.body.affectedPeople) || 0),
      reportedBy: req.user._id,
      images: (req.files || []).map((file) => `/uploads/${file.filename}`)
    });
    const created = await incident.populate('reportedBy', 'name');
    req.app.get('io')?.emit('disaster:new', created);
    res.status(201).json(created);
  })
);

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.severity) updates.severity = req.body.severity;
  const incident = await Disaster.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!incident) {
    res.status(404);
    throw new Error('Disaster not found');
  }
  req.app.get('io')?.emit('disaster:updated', incident);
  res.json(incident);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const incident = await Disaster.findByIdAndDelete(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Disaster not found');
  }
  res.json({ message: 'Disaster removed' });
}));

export default router;
