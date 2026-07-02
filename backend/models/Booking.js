import db from '../config/db.js';

class Booking {
  static async create({
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
    paymentStatus = 'Paid',
    bookingStatus = 'Confirmed',
    ticketPdfPath = null,
    terminal = null,
    gate = null,
    transactionId = null,
    cabinClass = null,
    gender = null,
    dob = null,
    nationality = null,
    passportNumber = null
  }) {
    // Parse flightId to ensure SQLite compatibility (handle string IDs like "flight-card-X")
    let parsedFlightId = 1;
    if (typeof flightId === 'string' && flightId.startsWith('flight-card-')) {
      const idx = parseInt(flightId.replace('flight-card-', ''));
      if (!isNaN(idx)) {
        parsedFlightId = idx + 1;
      }
    } else {
      const parsed = parseInt(flightId);
      if (!isNaN(parsed)) {
        parsedFlightId = parsed;
      }
    }

    // Start a transaction to ensure atomic seat decrease and booking creation
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create booking
      const [result] = await connection.query(
        `INSERT INTO bookings (
          pnr, user_id, flight_id, passenger_name, email, mobile, 
          departure, destination, travel_date, departure_time, arrival_time, 
          seat_number, meal, fare, payment_status, booking_status,
          ticket_pdf_path, terminal, gate, transaction_id, cabin_class,
          gender, dob, nationality, passport_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pnr, userId, parsedFlightId, passengerName, email, mobile,
          departure, destination, travelDate, departureTime, arrivalTime,
          seatNumber, meal, fare, paymentStatus, bookingStatus,
          ticketPdfPath, terminal, gate, transactionId, cabinClass,
          gender, dob, nationality, passportNumber
        ]
      );
      const bookingId = result.insertId;

      // 2. Decrease available seats for the flight
      await connection.query(
        'UPDATE flights SET available_seats = CASE WHEN available_seats > 0 THEN available_seats - 1 ELSE 0 END WHERE id = ?',
        [parsedFlightId]
      );

      await connection.commit();
      return bookingId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(
      `SELECT b.*, f.flight_number, f.airline, f.aircraft 
       FROM bookings b 
       LEFT JOIN flights f ON b.flight_id = f.id 
       WHERE b.user_id = ? 
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findUpcomingByUserId(userId) {
    // Find the latest active/confirmed booking
    const [rows] = await db.query(
      `SELECT b.*, f.flight_number, f.airline, f.aircraft 
       FROM bookings b 
       LEFT JOIN flights f ON b.flight_id = f.id 
       WHERE b.user_id = ? AND b.booking_status = 'Confirmed'
       ORDER BY b.travel_date DESC, b.departure_time DESC 
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async findHistoryByUserId(userId) {
    // Find past trips (travel_date in the past) or cancelled trips
    const [rows] = await db.query(
      `SELECT b.*, f.flight_number, f.airline, f.aircraft 
       FROM bookings b 
       LEFT JOIN flights f ON b.flight_id = f.id 
       WHERE b.user_id = ? AND (b.booking_status = 'Cancelled' OR b.travel_date < CURRENT_DATE)
       ORDER BY b.travel_date DESC`,
      [userId]
    );
    return rows;
  }

  static async findByPnr(pnr) {
    const [rows] = await db.query(
      `SELECT b.*, f.flight_number, f.airline, f.aircraft 
       FROM bookings b 
       LEFT JOIN flights f ON b.flight_id = f.id 
       WHERE b.pnr = ?`,
      [pnr]
    );
    return rows[0] || null;
  }

  static async cancel(pnr, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if booking exists and is confirmed
      const [bookings] = await connection.query(
        'SELECT * FROM bookings WHERE pnr = ? AND user_id = ?',
        [pnr, userId]
      );
      const booking = bookings[0];

      if (!booking) {
        throw new Error('Booking not found.');
      }

      if (booking.booking_status === 'Cancelled') {
        throw new Error('Booking is already cancelled.');
      }

      // Update status to Cancelled
      await connection.query(
        'UPDATE bookings SET booking_status = "Cancelled" WHERE pnr = ? AND user_id = ?',
        [pnr, userId]
      );

      // Increase available seats
      await connection.query(
        'UPDATE flights SET available_seats = available_seats + 1 WHERE id = ?',
        [booking.flight_id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default Booking;
