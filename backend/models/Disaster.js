import mongoose from 'mongoose';

const disasterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'other'],
    required: true
  },
  description: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['reported', 'verified', 'resolved', 'closed'],
    default: 'reported'
  },
  affectedPeople: { type: Number, default: 0, min: 0 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [{ type: String }]
}, { timestamps: true });

const Disaster = mongoose.model('Disaster', disasterSchema);
export default Disaster;
