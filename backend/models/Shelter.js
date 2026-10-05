import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  capacity: { type: Number, required: true, min: 1 },
  occupied: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator(value) { return value <= this.capacity; },
      message: 'Occupied spaces cannot exceed shelter capacity'
    }
  },
  facilities: [{ type: String }],
  contact: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'full'], default: 'open' }
}, { timestamps: true });

export default mongoose.model('Shelter', shelterSchema);
