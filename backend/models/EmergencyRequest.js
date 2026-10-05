import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  emergencyType: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  status: {
    type: String,
  enum: ['sent', 'dispatched', 'resolved', 'Pending', 'Accepted', 'Rescue Team Assigned', 'On The Way', 'Rescued', 'Completed'],
  default: 'sent'
  },
  assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Rescue team user ID
}, { timestamps: true });

export default mongoose.model('EmergencyRequest', emergencyRequestSchema);
