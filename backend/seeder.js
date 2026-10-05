import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Disaster from './models/Disaster.js';
import Shelter from './models/Shelter.js';
import Hospital from './models/Hospital.js';
import { connectDatabase } from './config/database.js';
import { pathToFileURL } from 'node:url';

const demoUsers = [
  { name: 'DisasterX Admin', email: 'admin@disasterx.org', password: 'DisasterX2026!', role: 'admin', phone: '+91 11 112 0112' },
  { name: 'Admin User', email: 'admin@dms.com', password: 'password', role: 'admin', phone: '+91 11 112 0112' },
  { name: 'Aarav Mehta', email: 'volunteer@disasterx.org', password: 'DisasterX2026!', role: 'volunteer', phone: '+91 98765 10001' },
  { name: 'Priya Sharma', email: 'citizen@disasterx.org', password: 'DisasterX2026!', role: 'citizen', phone: '+91 98765 10002' }
];

const incidentSamples = [
  ['Yamuna river watch — low-lying banks', 'flood', 'high', 'Rising water is affecting access roads near the riverbank. Local teams are monitoring nearby homes.', 'Yamuna Bazar, Delhi', 28.6554, 77.2371, 126, 'verified'],
  ['Electrical fire near market warehouses', 'fire', 'critical', 'Smoke reported from a warehouse block. Fire services have been notified; keep a safe perimeter.', 'Chandni Chowk, Delhi', 28.6506, 77.2303, 48, 'verified'],
  ['Waterlogging on arterial road', 'flood', 'medium', 'Heavy rainfall has blocked traffic and pedestrian access along the service road.', 'ITO Crossing, New Delhi', 28.6289, 77.2410, 80, 'reported'],
  ['Slope instability after heavy rain', 'landslide', 'high', 'Cracks observed along a hillside road cut. Residents are advised to use the alternate route.', 'Mehrauli Ridge, Delhi', 28.5141, 77.1808, 32, 'verified'],
  ['Structural tremor assessment', 'earthquake', 'low', 'Minor tremors reported. Building inspections are underway; no major damage has been confirmed.', 'Noida Sector 18, Uttar Pradesh', 28.5708, 77.3261, 16, 'reported'],
  ['Drain overflow in residential block', 'flood', 'medium', 'Overflowing drainage is affecting ground-floor access. Pumping support has been requested.', 'Lajpat Nagar, Delhi', 28.5677, 77.2433, 61, 'reported'],
  ['Brush fire contained near green belt', 'fire', 'low', 'A small brush fire was reported along the green belt. Crews are checking for hot spots.', 'Dwarka Sector 10, Delhi', 28.5817, 77.0580, 12, 'resolved'],
  ['Storm damage to power lines', 'cyclone', 'high', 'Strong winds have brought down utility lines. Avoid the area while repair crews secure the site.', 'Rohini Sector 15, Delhi', 28.7332, 77.1151, 35, 'verified'],
  ['Roadside retaining wall damage', 'landslide', 'medium', 'A retaining wall has shifted following intense rainfall. Road access is restricted pending inspection.', 'Vasant Kunj, New Delhi', 28.5207, 77.1590, 21, 'reported'],
  ['Community support request', 'other', 'low', 'A localized request for drinking water and first-aid supplies is being coordinated with volunteers.', 'Anand Vihar, Delhi', 28.6469, 77.3160, 27, 'reported']
];
const shelterSamples = [
  ['Central Relief Pavilion', 'Indira Gandhi Indoor Stadium, Delhi', 28.6154, 77.2450, 520, 286, '011-2301-1120', ['Medical', 'Meals', 'Family rooms']],
  ['Yamuna Community Hall', 'Civil Lines, Delhi', 28.6764, 77.2250, 240, 187, '011-2301-1080', ['Water', 'Meals', 'Charging']],
  ['South District Safe Point', 'Lajpat Nagar, Delhi', 28.5672, 77.2430, 180, 74, '011-2301-1088', ['Medical', 'Accessible', 'Meals']],
  ['Dwarka Relief Centre', 'Sector 10, Dwarka, Delhi', 28.5819, 77.0591, 320, 205, '011-2301-1091', ['Beds', 'Water', 'Family rooms']],
  ['Noida Sector 18 Shelter', 'Sector 18, Noida, Uttar Pradesh', 28.5704, 77.3216, 410, 327, '0120-440-1088', ['Medical', 'Meals', 'Charging']],
  ['Rohini Community Shelter', 'Sector 15, Rohini, Delhi', 28.7338, 77.1142, 260, 133, '011-2301-1142', ['Water', 'Beds', 'Medical']],
  ['East Delhi Relief Hub', 'Anand Vihar, Delhi', 28.6466, 77.3154, 150, 149, '011-2301-1155', ['Meals', 'Accessible']],
  ['Mehrauli Family Shelter', 'Mehrauli, New Delhi', 28.5148, 77.1815, 200, 56, '011-2301-1171', ['Family rooms', 'Beds', 'Water']]
];
const hospitalSamples = [
  ['Lok Nayak Emergency Centre', 'Jawaharlal Nehru Marg, New Delhi', 28.6392, 77.2410, '011-2323-6000'],
  ['Safdarjung Trauma Response', 'Ansari Nagar West, New Delhi', 28.5672, 77.2081, '011-2673-0000'],
  ['Noida District Emergency Hospital', 'Sector 39, Noida, Uttar Pradesh', 28.5672, 77.3610, '0120-250-7777'],
  ['Guru Teg Bahadur Hospital', 'Dilshad Garden, Delhi', 28.6842, 77.3067, '011-2258-6262']
];

export async function seedDemoData() {
  const users = [];
  for (const details of demoUsers) {
    let user = await User.findOne({ email: details.email });
    if (!user) user = new User(details);
    else {
      user.name = details.name;
      user.password = details.password;
      user.role = details.role;
      user.phone = details.phone;
    }
    await user.save();
    users.push(user);
  }
  if (await Disaster.countDocuments() === 0) {
    await Disaster.create(incidentSamples.map(([title, type, severity, description, address, lat, lng, affectedPeople, status], index) => ({
      title, type, severity, description, location: { address, lat, lng }, affectedPeople, status, reportedBy: users[index % users.length]._id
    })));
  }
  if (await Shelter.countDocuments() === 0) {
    await Shelter.create(shelterSamples.map(([name, address, lat, lng, capacity, occupied, contact, facilities]) => ({
      name, location: { address, lat, lng }, capacity, occupied, contact, facilities, status: 'open'
    })));
  }
  if (await Hospital.countDocuments() === 0) {
    await Hospital.create(hospitalSamples.map(([name, address, lat, lng, contact]) => ({
      name, location: { address, lat, lng }, contact, emergencyAvailable: true
    })));
  }
  console.log('Demo data is ready.');
  console.log('Admin: admin@disasterx.org / DisasterX2026!');
  console.log('Legacy demo admin: admin@dms.com / password');
  console.log('Volunteer: volunteer@disasterx.org / DisasterX2026!');
  console.log('Citizen: citizen@disasterx.org / DisasterX2026!');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  connectDatabase()
    .then(seedDemoData)
    .catch((error) => {
      console.error('Seed failed:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => { await mongoose.disconnect(); });
}
