require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const { initTables } = require('./db');
const User = require('./models/User');

async function seedAdmin() {
  try {
    await initTables();

    const email = process.env.ADMIN_EMAIL || 'admin@proximity.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const name = 'Proximity Admin';

    const existing = await User.findByEmail(email);
    if (existing) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }

    const admin = await User.create({ name, email, password, role: 'admin' });
    console.log(`Admin user created: ${admin.email}`);
    console.log('IMPORTANT: Change this password immediately after first login');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
