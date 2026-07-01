import Booking from '../models/Booking.js';
import db from '../config/db.js';
import { generateTicketPDF } from '../utils/ticketGenerator.js';
import { sendBookingConfirmation } from '../utils/emailService.js';

// Helper to generate a random 6-character alphanumeric PNR (e.g., "FX82MN")
const generatePNR = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
};

// Simulate verification for 2-3 seconds
export const verifyPayment = async (req, res) => {
  try {
    console.log('Simulating payment verification...');
    // Sleep for 2.5 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    console.log('Payment verified.');
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment.' });
  }
};

// Create a booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      flightId,
      passengerName,
      email,
      mobile,
      departure,
      destination,
      travelDate,
      departureTime,
      arrivalTime,
      seatNumber,
      meal,
      fare,
      // Extra details for the boarding pass/e-ticket
      gender,
      dob,
      nationality,
      passportNumber,
      cabinClass
    } = req.body;

    if (!flightId || !passengerName || !email || !mobile || !departure || !destination || !travelDate || !departureTime || !arrivalTime || !seatNumber || !meal || !fare) {
      return res.status(400).json({ message: 'All booking fields are required.' });
    }

    // Generate unique PNR
    let pnr = generatePNR();
    let pnrExists = true;
    
    // Ensure PNR uniqueness
    while (pnrExists) {
      const existing = await Booking.findByPnr(pnr);
      if (!existing) {
        pnrExists = false;
      } else {
        pnr = generatePNR();
      }
    }

    // Fetch flight details to get flight_number and airline
    let flightNumber = 'FE-201';
    let airline = 'FlyEasy Airways';
    try {
      const [flights] = await db.query('SELECT flight_number, airline FROM flights WHERE id = ?', [flightId]);
      if (flights && flights[0]) {
        flightNumber = flights[0].flight_number;
        airline = flights[0].airline;
      }
    } catch (err) {
      console.warn("Could not fetch flight number for booking PDF:", err);
    }

    // Generate terminal, gate and transaction ID
    const digits = flightNumber.replace(/\D/g, '') || '201';
    const gateNum = (parseInt(digits) % 15) + 1;
    const gate = `B${gateNum}`;
    const terminal = ((parseInt(digits) % 2) + 1).toString();
    const transactionId = 'TXN' + Math.floor(10000000 + Math.random() * 90000000);

    // Calculate boarding time (35 mins before departure)
    let boardingTime = '09:20 AM';
    if (departureTime) {
      try {
        const timeParts = departureTime.split(':');
        const depHour = parseInt(timeParts[0]);
        const depMin = parseInt(timeParts[1]);

        let boardingMin = depMin - 35;
        let boardingHour = depHour;
        if (boardingMin < 0) {
          boardingMin += 60;
          boardingHour -= 1;
        }
        if (boardingHour < 0) {
          boardingHour += 24;
        }

        const ampm = boardingHour >= 12 ? 'PM' : 'AM';
        const displayHour = boardingHour % 12 || 12;
        const displayMin = boardingMin.toString().padStart(2, '0');
        boardingTime = `${displayHour}:${displayMin} ${ampm}`;
      } catch (err) {
        console.error('Error calculating boarding time:', err);
      }
    }

    // Save booking in the database
    const bookingId = await Booking.create({
      pnr,
      userId,
      flightId,
      passengerName,
      email,
      mobile,
      departure,
      destination,
      travelDate,
      departureTime,
      arrivalTime,
      seatNumber,
      meal,
      fare,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      terminal,
      gate,
      transactionId,
      cabinClass: cabinClass || 'Economy',
      gender: gender || 'Male',
      dob: dob || '2000-01-01',
      nationality: nationality || 'Indian',
      passportNumber: passportNumber || 'N/A'
    });

    // Generate E-Ticket PDF
    let ticketPdfPath = '';
    try {
      ticketPdfPath = await generateTicketPDF({
        bookingId,
        pnr,
        userId,
        flightId,
        passengerName,
        email,
        mobile,
        departure,
        destination,
        travelDate,
        departureTime,
        arrivalTime,
        seatNumber,
        meal,
        fare,
        flightNumber,
        airline,
        terminal,
        gate,
        transactionId,
        cabinClass: cabinClass || 'Economy',
        gender: gender || 'Male',
        dob: dob || '2000-01-01',
        nationality: nationality || 'Indian',
        passportNumber: passportNumber || 'N/A',
        boardingTime
      });

      // Save PDF path to the database
      await db.query('UPDATE bookings SET ticket_pdf_path = ? WHERE booking_id = ?', [ticketPdfPath, bookingId]);

      // Automatically send confirmation email
      try {
        await sendBookingConfirmation({
          bookingId,
          pnr,
          userId,
          flightId,
          passengerName,
          email,
          mobile,
          departure,
          destination,
          travelDate,
          departureTime,
          arrivalTime,
          seatNumber,
          meal,
          fare,
          flightNumber,
          airline,
          terminal,
          gate,
          transactionId,
          cabinClass: cabinClass || 'Economy',
          ticketPdfPath,
          boardingTime
        });
      } catch (emailErr) {
        console.error("Error automatically sending confirmation email:", emailErr);
      }
    } catch (pdfErr) {
      console.error("Error generating ticket PDF:", pdfErr);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      bookingId,
      pnr,
      ticketPdfPath
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error creating booking.' });
  }
};

// Get all user bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.findByUserId(userId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    res.status(500).json({ message: 'Error fetching user bookings.' });
  }
};

// Get upcoming journey (the latest active booking)
export const getUpcomingBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const booking = await Booking.findUpcomingByUserId(userId);
    
    if (!booking) {
      return res.status(200).json(null);
    }

    // Attach mock terminal and gate details
    const flightNoStr = booking.flight_number || 'FE201';
    const digits = flightNoStr.replace(/\D/g, '');
    const gateNum = (parseInt(digits) % 15) + 1; // Gate between B1 and B15
    const terminal = (parseInt(digits) % 2) + 1;  // Terminal 1 or 2

    res.status(200).json({
      ...booking,
      terminal: booking.terminal || terminal.toString(),
      gate: booking.gate || `B${gateNum}`
    });
  } catch (error) {
    console.error('Fetch upcoming checkin error:', error);
    res.status(500).json({ message: 'Error fetching upcoming check-in.' });
  }
};

// Get recent history
export const getRecentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await Booking.findHistoryByUserId(userId);
    res.status(200).json(history);
  } catch (error) {
    console.error('Fetch booking history error:', error);
    res.status(500).json({ message: 'Error fetching travel history.' });
  }
};

// Get boarding pass details for a specific PNR
export const getBoardingPass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pnr } = req.params;

    const booking = await Booking.findByPnr(pnr);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Verify ownership
    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: You do not own this booking.' });
    }

    // Mock terminal, gate and boarding time (35 mins before departure)
    const flightNoStr = booking.flight_number || 'FE201';
    const digits = flightNoStr.replace(/\D/g, '');
    const gateNum = (parseInt(digits) % 15) + 1;
    const terminal = (parseInt(digits) % 2) + 1;

    // Boarding time calculation: 35 minutes before departure time
    let boardingTime = '09:20 AM';
    if (booking.departure_time) {
      try {
        const timeParts = booking.departure_time.split(':');
        const depHour = parseInt(timeParts[0]);
        const depMin = parseInt(timeParts[1]);

        let boardingMin = depMin - 35;
        let boardingHour = depHour;
        if (boardingMin < 0) {
          boardingMin += 60;
          boardingHour -= 1;
        }
        if (boardingHour < 0) {
          boardingHour += 24;
        }

        const ampm = boardingHour >= 12 ? 'PM' : 'AM';
        const displayHour = boardingHour % 12 || 12;
        const displayMin = boardingMin.toString().padStart(2, '0');
        boardingTime = `${displayHour}:${displayMin} ${ampm}`;
      } catch (err) {
        console.error('Error calculating boarding time:', err);
      }
    }

    res.status(200).json({
      bookingId: booking.booking_id,
      passengerName: booking.passenger_name,
      flightNumber: booking.flight_number || 'FE201',
      pnr: booking.pnr,
      seat: booking.seat_number,
      terminal: booking.terminal || terminal.toString(),
      gate: booking.gate || `B${gateNum}`,
      boardingTime,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      departure: booking.departure,
      destination: booking.destination,
      travelDate: booking.travel_date,
      status: booking.booking_status,
      ticketPdfPath: booking.ticket_pdf_path || '',
      cabinClass: booking.cabin_class || 'Economy',
      gender: booking.gender || 'Male',
      dob: booking.dob || '',
      nationality: booking.nationality || '',
      passportNumber: booking.passport_number || '',
      email: booking.email || '',
      mobile: booking.mobile || '',
      transactionId: booking.transaction_id || ''
    });
  } catch (error) {
    console.error('Fetch boarding pass error:', error);
    res.status(500).json({ message: 'Error fetching boarding pass details.' });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pnr } = req.body;

    if (!pnr) {
      return res.status(400).json({ message: 'PNR number is required to cancel.' });
    }

    await Booking.cancel(pnr, userId);
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ message: error.message || 'Error cancelling booking.' });
  }
};

// Send booking confirmation email on demand
export const sendBookingConfirmationEmail = async (req, res) => {
  try {
    const { pnr } = req.body;
    if (!pnr) {
      return res.status(400).json({ message: 'PNR number is required.' });
    }

    // Retrieve booking
    const [rows] = await db.query(
      `SELECT b.*, f.flight_number, f.airline, f.aircraft 
       FROM bookings b 
       LEFT JOIN flights f ON b.flight_id = f.id 
       WHERE b.pnr = ?`,
      [pnr]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const dbBooking = rows[0];
    
    // Map db fields to function parameter structure
    const payload = {
      bookingId: dbBooking.booking_id,
      pnr: dbBooking.pnr,
      passengerName: dbBooking.passenger_name,
      email: dbBooking.email,
      mobile: dbBooking.mobile,
      departure: dbBooking.departure,
      destination: dbBooking.destination,
      travelDate: dbBooking.travel_date,
      departureTime: dbBooking.departure_time,
      arrivalTime: dbBooking.arrival_time,
      seatNumber: dbBooking.seat_number,
      meal: dbBooking.meal,
      fare: dbBooking.fare,
      flightNumber: dbBooking.flight_number || 'FE-201',
      airline: dbBooking.airline || 'FlyEasy Airways',
      terminal: dbBooking.terminal || '2',
      gate: dbBooking.gate || 'B7',
      transactionId: dbBooking.transaction_id,
      cabinClass: dbBooking.cabin_class || 'Economy',
      ticketPdfPath: dbBooking.ticket_pdf_path
    };

    const emailResult = await sendBookingConfirmation(payload);

    res.status(200).json({
      success: true,
      message: 'Confirmation email sent successfully!',
      messageId: emailResult.messageId,
      previewUrl: emailResult.previewUrl
    });
  } catch (error) {
    console.error('Email route error:', error);
    res.status(500).json({ message: 'Failed to send confirmation email.' });
  }
};
