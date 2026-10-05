import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { getJwtSecret } from '../config/jwt.js';

const router = express.Router();
const tokenFor = (id) => jwt.sign({ id }, getJwtSecret(), { expiresIn: '7d' });
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  token: tokenFor(user._id)
});

router.post('/register',
  body('name').trim().isLength({ min: 2, max: 80 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  body('role').optional().isIn(['citizen', 'volunteer']),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (await User.exists({ email })) {
      res.status(409);
      throw new Error('An account with this email already exists');
    }
    const user = await User.create({ name, email, password, phone, role: req.body.role || 'citizen' });
    res.status(201).json(userResponse(user));
  })
);

router.post('/login',
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      res.status(401);
      throw new Error('Email or password is incorrect');
    }
    res.json(userResponse(user));
  })
);

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone
  });
}));

export default router;
