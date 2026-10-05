import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  contact: { type: String, required: true },
  emergencyAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Hospital', hospitalSchema);
