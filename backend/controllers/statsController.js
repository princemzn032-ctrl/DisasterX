import asyncHandler from 'express-async-handler';
import Disaster from '../models/Disaster.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Shelter from '../models/Shelter.js';
import User from '../models/User.js';

export const getStats = asyncHandler(async (req, res) => {
  const [activeDisasters, peopleRescued, openShelters, volunteersOnline, disasterTypes] = await Promise.all([
    Disaster.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
    EmergencyRequest.countDocuments({ status: { $in: ['resolved', 'Rescued', 'Completed'] } }),
    Shelter.countDocuments({ status: 'open', $expr: { $lt: ['$occupied', '$capacity'] } }),
    User.countDocuments({ role: 'volunteer', status: 'active' }),
    Disaster.aggregate([
      { $match: { status: { $nin: ['resolved', 'closed'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
  ]);
  res.json({ activeDisasters, peopleRescued, openShelters, volunteersOnline, disasterTypes });
});
