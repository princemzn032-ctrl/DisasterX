const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend');

const files = {
  "middleware/authMiddleware.js": `import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

export { protect, admin };
`,
  "models/EmergencyRequest.js": `import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  emergencyType: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rescue Team Assigned', 'On The Way', 'Rescued', 'Completed'],
    default: 'Pending'
  },
  assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Rescue team user ID
}, { timestamps: true });

export default mongoose.model('EmergencyRequest', emergencyRequestSchema);
`,
  "models/Shelter.js": `import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  capacity: { type: Number, required: true },
  occupied: { type: Number, default: 0 },
  facilities: [{ type: String }],
  contact: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'full'], default: 'open' }
}, { timestamps: true });

export default mongoose.model('Shelter', shelterSchema);
`,
  "models/Hospital.js": `import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contact: { type: String, required: true },
  emergencyAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Hospital', hospitalSchema);
`,
  "routes/authRoutes.js": `import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
}));

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'citizen',
    location: { address: 'Unknown', lat: 0, lng: 0 }
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
}));

// @desc    Get user profile
// @route   GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}));

export default router;
`,
  "routes/disasterRoutes.js": `import express from 'express';
import asyncHandler from 'express-async-handler';
import Disaster from '../models/Disaster.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(asyncHandler(async (req, res) => {
    const disasters = await Disaster.find({}).sort({ createdAt: -1 });
    res.json(disasters);
  }))
  .post(protect, asyncHandler(async (req, res) => {
    const { title, type, description, location, severity, affectedPeople } = req.body;
    const disaster = new Disaster({
      title, type, description, location, severity, affectedPeople,
      reportedBy: req.user._id,
      status: 'reported'
    });
    const createdDisaster = await disaster.save();
    res.status(201).json(createdDisaster);
  }));

router.route('/:id')
  .put(protect, admin, asyncHandler(async (req, res) => {
    const disaster = await Disaster.findById(req.params.id);
    if (disaster) {
      disaster.status = req.body.status || disaster.status;
      disaster.severity = req.body.severity || disaster.severity;
      const updatedDisaster = await disaster.save();
      res.json(updatedDisaster);
    } else {
      res.status(404);
      throw new Error('Disaster not found');
    }
  }))
  .delete(protect, admin, asyncHandler(async (req, res) => {
    const disaster = await Disaster.findById(req.params.id);
    if (disaster) {
      await disaster.deleteOne();
      res.json({ message: 'Disaster removed' });
    } else {
      res.status(404);
      throw new Error('Disaster not found');
    }
  }));

export default router;
`,
  "routes/emergencyRoutes.js": `import express from 'express';
import asyncHandler from 'express-async-handler';
import EmergencyRequest from '../models/EmergencyRequest.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, asyncHandler(async (req, res) => {
    // If admin, show all. If rescue team, show assigned or pending. If citizen, show their own.
    let requests;
    if (req.user.role === 'admin') {
      requests = await EmergencyRequest.find({}).populate('userId', 'name phone').sort({ createdAt: -1 });
    } else if (req.user.role === 'rescue_team') {
      requests = await EmergencyRequest.find({ $or: [{ assignedTeam: req.user._id }, { status: 'Pending' }] }).populate('userId', 'name phone').sort({ createdAt: -1 });
    } else {
      requests = await EmergencyRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    }
    res.json(requests);
  }))
  .post(protect, asyncHandler(async (req, res) => {
    const { location, emergencyType, severity } = req.body;
    const request = new EmergencyRequest({
      userId: req.user._id,
      location,
      emergencyType,
      severity,
      status: 'Pending'
    });
    const createdRequest = await request.save();
    res.status(201).json(createdRequest);
  }));

router.route('/:id')
  .put(protect, asyncHandler(async (req, res) => {
    const request = await EmergencyRequest.findById(req.params.id);
    if (request) {
      // Allow admin or assigned rescue team to update
      if (req.user.role === 'admin' || req.user.role === 'rescue_team') {
        request.status = req.body.status || request.status;
        if (req.body.assignedTeam) {
            request.assignedTeam = req.body.assignedTeam;
        }
        const updatedRequest = await request.save();
        res.json(updatedRequest);
      } else {
        res.status(401);
        throw new Error('Not authorized to update this request');
      }
    } else {
      res.status(404);
      throw new Error('Request not found');
    }
  }));

export default router;
`,
  "routes/shelterRoutes.js": `import express from 'express';
import asyncHandler from 'express-async-handler';
import Shelter from '../models/Shelter.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(asyncHandler(async (req, res) => {
    const shelters = await Shelter.find({});
    res.json(shelters);
  }))
  .post(protect, admin, asyncHandler(async (req, res) => {
    const shelter = new Shelter(req.body);
    const createdShelter = await shelter.save();
    res.status(201).json(createdShelter);
  }));

export default router;
`,
  "server.js": `import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import disasterRoutes from './routes/disasterRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dms')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/shelters', shelterRoutes);

// Error Handling Middleware
app.use((req, res, next) => {
  const error = new Error(\`Not Found - \${req.originalUrl}\`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server running in \${process.env.NODE_ENV} mode on port \${PORT}\`);
});
`,
  "seeder.js": `import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Disaster from './models/Disaster.js';
import Shelter from './models/Shelter.js';
import EmergencyRequest from './models/EmergencyRequest.js';

dotenv.config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dms');

const seedData = async () => {
  try {
    await User.deleteMany();
    await Disaster.deleteMany();
    await Shelter.deleteMany();
    await EmergencyRequest.deleteMany();

    const createdUsers = await User.create([
      { name: 'Admin User', email: 'admin@dms.com', password: 'password', role: 'admin' },
      { name: 'Rescue Team 1', email: 'rescue@dms.com', password: 'password', role: 'rescue_team' },
      { name: 'John Doe', email: 'john@example.com', password: 'password', role: 'citizen' }
    ]);

    const adminUser = createdUsers[0]._id;
    const citizenUser = createdUsers[2]._id;

    await Disaster.create([
      { title: 'Severe Flooding in Downtown', type: 'flood', description: 'Heavy rains have caused the river to overflow.', location: { address: 'Downtown Center', lat: 28.6139, lng: 77.2090 }, severity: 'critical', status: 'verified', affectedPeople: 500, reportedBy: citizenUser },
      { title: 'Forest Fire near Hills', type: 'fire', description: 'Wildfire spreading rapidly.', location: { address: 'Northern Hills', lat: 28.7041, lng: 77.1025 }, severity: 'high', status: 'reported', affectedPeople: 50, reportedBy: adminUser }
    ]);

    await Shelter.create([
      { name: 'City Relief Camp', location: { address: 'Main Stadium', lat: 28.5355, lng: 77.3910 }, capacity: 1000, occupied: 250, facilities: ['Food', 'Medical', 'Beds'], contact: '999-888-7777', status: 'open' },
      { name: 'Community Hall Shelter', location: { address: 'East Zone', lat: 28.5355, lng: 77.3910 }, capacity: 200, occupied: 180, facilities: ['Food', 'Water'], contact: '111-222-3333', status: 'open' }
    ]);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Backend files generated successfully!");
