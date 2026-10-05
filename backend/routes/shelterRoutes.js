import express from 'express';
import asyncHandler from 'express-async-handler';
import Shelter from '../models/Shelter.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', asyncHandler(async (req, res) => {
  res.json(await Shelter.find().sort({ name: 1 }));
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const shelter = await Shelter.create(req.body);
  res.status(201).json(shelter);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) {
    res.status(404);
    throw new Error('Shelter not found');
  }
  const editableFields = ['name', 'location', 'capacity', 'occupied', 'facilities', 'contact', 'status'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) shelter[field] = req.body[field];
  });
  res.json(await shelter.save());
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const shelter = await Shelter.findByIdAndDelete(req.params.id);
  if (!shelter) {
    res.status(404);
    throw new Error('Shelter not found');
  }
  res.json({ message: 'Shelter removed' });
}));

export default router;
