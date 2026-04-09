require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email: 'admin@proximity.com' });
  if (existing) {
    console.log('Admin already exists');
    await mongoose.disconnect();
    process.exit(0);
  }
  const admin = new User({
    name: 'Proximity Admin',
    email: 'admin@proximity.com',
    password: 'Admin@123',
    role: 'admin'
  });
  await admin.save();
  console.log('Admin user created: admin@proximity.com / Admin@123');
  console.log('IMPORTANT: Change this password immediately after first login');
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
