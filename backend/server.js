import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { mockFlights } from './utils/flightsData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);


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
