require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Please configure it before seeding.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL || 'admin@proximity.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = new User({ name: 'Proximity Admin', email, password, role: 'admin' });
  await admin.save();
  console.log(`Admin user created: ${email}`);
  console.log('IMPORTANT: Change this password immediately after first login');
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
