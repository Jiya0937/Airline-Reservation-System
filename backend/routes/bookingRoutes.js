import express from 'express';
import {
  verifyPayment,
  createBooking,
  getUserBookings,
  getUpcomingBooking,
  getRecentHistory,
  getBoardingPass,
  cancelBooking,
  sendBookingConfirmationEmail
} from '../controllers/bookingController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Payment API
router.post('/payment/verify', authMiddleware, verifyPayment);

// Booking creation and fetch
router.post('/bookings/create', authMiddleware, createBooking);
router.get('/bookings/user', authMiddleware, getUserBookings);
router.post('/bookings/cancel', authMiddleware, cancelBooking);

// Email notification API
router.post('/email/send-booking-confirmation', authMiddleware, sendBookingConfirmationEmail);

// Check-in, travel history, and digital boarding pass
router.get('/checkin', authMiddleware, getUpcomingBooking);
router.get('/history', authMiddleware, getRecentHistory);
router.get('/boarding-pass/:pnr', authMiddleware, getBoardingPass);

export default router;
