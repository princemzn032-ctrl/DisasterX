import express from 'express';
import asyncHandler from 'express-async-handler';
import Hospital from '../models/Hospital.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', asyncHandler(async (req, res) => {
  res.json(await Hospital.find().sort({ name: 1 }));
}));
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  res.status(201).json(await Hospital.create(req.body));
}));
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndDelete(req.params.id);
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital not found');
  }
  res.json({ message: 'Hospital removed' });
}));
export default router;
