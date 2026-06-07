const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import Middlewares
const authMiddleware = require('./middlewares/authMiddleware');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Mount Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
