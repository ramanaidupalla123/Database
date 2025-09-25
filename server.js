const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.log('💡 Please set MONGODB_URI in your Render environment variables');
}

console.log('🔗 Connecting to MongoDB...');
console.log('📦 Environment:', process.env.NODE_ENV);

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('🔧 MongoDB URI:', MONGODB_URI ? 'Provided' : 'Missing');
    });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 MongoDB: ${MONGODB_URI ? 'Configured' : 'Not Configured'}`);
});