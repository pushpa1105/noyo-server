const User = require('../models/userModel');

const initializeApp = async () => {
    try {
        //TODO: Move this to env or change admin user flow
        const adminCredentials = {
            name: 'Admin User',
            email: 'admin@admin.com',
            password: 'Admin@123',
            role: 'admin'
        }

        console.log('🌱 Checking for admin user...');
        const adminUser = await User.findOne({ email: adminCredentials.email });

        if (adminUser) {
            console.log('🌱 Admin user already exists.');
        } else {
            console.log('🌱 Creating admin user....');
            await User.create(adminCredentials);
            console.log('🌱 Admin user created successfully.');
        }

        console.log('✅ App initialized successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
};

module.exports = initializeApp;
