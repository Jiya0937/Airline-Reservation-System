import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { mockFlights } from './utils/flightsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

// Serve static tickets folder
app.use('/tickets', express.static(path.join(__dirname, 'public/tickets')));

// Auth Routes
app.use('/api/auth', authRoutes);

// Booking, Payment, Checkin, and History Routes
app.use('/api', bookingRoutes);


// API Flight Search Route
app.get('/api/flights', (req, res) => {
  const { from = 'Delhi (DEL)', to = 'Mumbai (BOM)', depDate, retDate, passengers = 1, cabinClass = 'Economy' } = req.query;

  // Simulate search filter by translating mock flight destinations to match query inputs
  const results = mockFlights.map(flight => {
    return {
      ...flight,
      from: from,
      to: to
    };
  });

  res.json({
    searchQuery: { from, to, depDate, retDate, passengers, cabinClass },
    flights: results
  });
});

app.listen(PORT, () => {
  console.log(`FlyEasy Backend Mock API Server running on port ${PORT}`);
});
