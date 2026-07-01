import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let isMockMode = false;

// Path to persist mock database state
let mockDbFilePath = path.resolve('database', 'mock_db_state.json');
if (!fs.existsSync(path.dirname(mockDbFilePath))) {
  mockDbFilePath = path.resolve('..', 'database', 'mock_db_state.json');
}

let inMemoryDb = {
  users: [],
  bookings: [],
  flights: [
    { id: 1, airline: 'FlyEasy Airways', flight_number: 'FE-201', aircraft: 'Airbus A350-900', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure_time: '06:00:00', arrival_time: '08:15:00', duration: '2h 15m', stops: 0, refundable: 1, tags: 'Best Value,Cheapest', available_seats: 60 },
    { id: 2, airline: 'IndiGo', flight_number: '6E-512', aircraft: 'Airbus A320neo', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure_time: '07:30:00', arrival_time: '09:45:00', duration: '2h 15m', stops: 0, refundable: 0, tags: 'Cheapest', available_seats: 60 },
    { id: 3, airline: 'Air India', flight_number: 'AI-805', aircraft: 'Boeing 787-8 Dreamliner', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure_time: '10:00:00', arrival_time: '12:15:00', duration: '2h 15m', stops: 0, refundable: 1, tags: 'Best Value', available_seats: 60 },
    { id: 4, airline: 'Vistara', flight_number: 'UK-985', aircraft: 'Boeing 787-9', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure_time: '15:45:00', arrival_time: '18:00:00', duration: '2h 15m', stops: 0, refundable: 1, tags: 'Fastest', available_seats: 60 },
    { id: 5, airline: 'Emirates', flight_number: 'EK-506', aircraft: 'Boeing 777-300ER', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure_time: '21:30:00', arrival_time: '23:55:00', duration: '2h 25m', stops: 0, refundable: 1, tags: 'Best Value', available_seats: 60 }
  ]
};

// Load existing mock DB state if present
try {
  if (fs.existsSync(mockDbFilePath)) {
    const saved = JSON.parse(fs.readFileSync(mockDbFilePath, 'utf8'));
    inMemoryDb.users = saved.users || [];
    inMemoryDb.bookings = saved.bookings || [];
    if (saved.flights && saved.flights.length > 0) {
      inMemoryDb.flights = saved.flights;
    }
  }
} catch (e) {
  // Ignore state read error
}

function saveMockDbState() {
  try {
    const targetDir = path.dirname(mockDbFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(mockDbFilePath, JSON.stringify(inMemoryDb, null, 2), 'utf8');
  } catch (e) {
    // Ignore state write error
  }
}

// Mock query logic that replicates SQL queries in JS logic
function executeMockQuery(sql, params = []) {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. SELECT * FROM users WHERE email = ?
  if (normalizedSql.includes('from users') && normalizedSql.includes('where email =')) {
    const email = params[0];
    const user = inMemoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return [[user ? { ...user } : null]];
  }

  // 2. SELECT * FROM users WHERE id = ?
  if (normalizedSql.includes('from users') && normalizedSql.includes('where id =')) {
    const id = Number(params[0]);
    const user = inMemoryDb.users.find(u => u.id === id);
    return [[user ? { ...user } : null]];
  }

  // 3. INSERT INTO users
  if (normalizedSql.startsWith('insert into users')) {
    const [fullName, email, password, mobile, country, city] = params;
    const newId = inMemoryDb.users.length + 1;
    const newUser = {
      id: newId,
      full_name: fullName,
      email,
      password,
      mobile,
      country,
      city,
      created_at: new Date().toISOString()
    };
    inMemoryDb.users.push(newUser);
    saveMockDbState();
    return [{ insertId: newId }];
  }

  // 4. UPDATE users SET full_name = ... WHERE id = ?
  if (normalizedSql.includes('update users set full_name =')) {
    const [fullName, mobile, country, city, id] = params;
    const userIndex = inMemoryDb.users.findIndex(u => u.id === Number(id));
    if (userIndex !== -1) {
      inMemoryDb.users[userIndex].full_name = fullName;
      inMemoryDb.users[userIndex].mobile = mobile;
      inMemoryDb.users[userIndex].country = country;
      inMemoryDb.users[userIndex].city = city;
      saveMockDbState();
    }
    return [{}];
  }

  // 5. UPDATE users SET password = ? WHERE id = ?
  if (normalizedSql.includes('update users set password =')) {
    const [hashedPassword, id] = params;
    const userIndex = inMemoryDb.users.findIndex(u => u.id === Number(id));
    if (userIndex !== -1) {
      inMemoryDb.users[userIndex].password = hashedPassword;
      saveMockDbState();
    }
    return [{}];
  }

  // 6. SELECT COUNT(*) as count FROM flights
  if (normalizedSql.includes('select count(*) as count from flights')) {
    return [[{ count: inMemoryDb.flights.length }]];
  }

  // SELECT * FROM flights WHERE id = ?
  if (normalizedSql.includes('from flights') && normalizedSql.includes('where id =')) {
    const flightId = Number(params[0]);
    const flight = inMemoryDb.flights.find(f => f.id === flightId);
    return [[flight ? { ...flight } : null]];
  }

  // 7. INSERT INTO bookings
  if (normalizedSql.startsWith('insert into bookings')) {
    const columnsMatch = sql.match(/\(([^)]+)\)/);
    if (columnsMatch) {
      const columns = columnsMatch[1].split(',').map(c => c.trim().toLowerCase());
      const newId = inMemoryDb.bookings.length + 1;
      const newBooking = {
        booking_id: newId,
        created_at: new Date().toISOString()
      };
      
      columns.forEach((col, index) => {
        let val = params[index];
        if (col === 'user_id' || col === 'flight_id') {
          newBooking[col] = val !== undefined && val !== null ? Number(val) : null;
        } else {
          newBooking[col] = val;
        }
      });
      
      if (!newBooking.payment_status) newBooking.payment_status = 'Paid';
      if (!newBooking.booking_status) newBooking.booking_status = 'Confirmed';
      
      inMemoryDb.bookings.push(newBooking);
      saveMockDbState();
      return [{ insertId: newId }];
    }
  }

  // 8. UPDATE flights SET available_seats = ...
  if (normalizedSql.includes('update flights set available_seats =')) {
    const flightId = Number(params[0]);
    const flight = inMemoryDb.flights.find(f => f.id === flightId);
    if (flight) {
      if (normalizedSql.includes('available_seats - 1') || normalizedSql.includes('greater_than_zero') || normalizedSql.includes('case when')) {
        flight.available_seats = Math.max(0, flight.available_seats - 1);
      } else if (normalizedSql.includes('available_seats + 1')) {
        flight.available_seats += 1;
      }
      saveMockDbState();
    }
    return [{}];
  }

  // 9. SELECT bookings b LEFT JOIN flights f ... WHERE b.user_id = ?
  if (normalizedSql.includes('from bookings b') && normalizedSql.includes('where b.user_id =')) {
    const userId = Number(params[0]);
    let filtered = inMemoryDb.bookings
      .filter(b => b.user_id === userId)
      .map(b => {
        const flight = inMemoryDb.flights.find(f => f.id === b.flight_id);
        return {
          ...b,
          flight_number: flight ? flight.flight_number : 'FE-201',
          airline: flight ? flight.airline : 'FlyEasy Airways',
          aircraft: flight ? flight.aircraft : 'Airbus A350-900'
        };
      });

    if (normalizedSql.includes("booking_status = 'confirmed'")) {
      filtered = filtered.filter(b => b.booking_status === 'Confirmed');
      filtered.sort((a, b) => new Date(b.travel_date) - new Date(a.travel_date));
      if (normalizedSql.includes('limit 1')) {
        return [[filtered[0] || null]];
      }
      return [filtered];
    }

    if (normalizedSql.includes("booking_status = 'cancelled'") || normalizedSql.includes("travel_date <")) {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(b => b.booking_status === 'Cancelled' || b.travel_date < todayStr);
      filtered.sort((a, b) => new Date(b.travel_date) - new Date(a.travel_date));
      return [filtered];
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return [filtered];
  }

  // 10. SELECT bookings b ... WHERE b.pnr = ?
  if (normalizedSql.includes('from bookings b') && normalizedSql.includes('where b.pnr =')) {
    const pnr = params[0];
    const b = inMemoryDb.bookings.find(x => x.pnr === pnr);
    if (b) {
      const flight = inMemoryDb.flights.find(f => f.id === b.flight_id);
      return [[{
        ...b,
        flight_number: flight ? flight.flight_number : 'FE-201',
        airline: flight ? flight.airline : 'FlyEasy Airways',
        aircraft: flight ? flight.aircraft : 'Airbus A350-900'
      }]];
    }
    return [[null]];
  }

  // 11. SELECT * FROM bookings WHERE pnr = ? AND user_id = ?
  if (normalizedSql.includes('from bookings') && normalizedSql.includes('pnr =') && normalizedSql.includes('user_id =')) {
    const [pnr, userId] = params;
    const b = inMemoryDb.bookings.find(x => x.pnr === pnr && x.user_id === Number(userId));
    return [[b ? { ...b } : null]];
  }

  // UPDATE bookings SET ticket_pdf_path = ? WHERE booking_id = ?
  if (normalizedSql.includes('update bookings set ticket_pdf_path =')) {
    const [pdfPath, bookingId] = params;
    const bookingIndex = inMemoryDb.bookings.findIndex(x => x.booking_id === Number(bookingId));
    if (bookingIndex !== -1) {
      inMemoryDb.bookings[bookingIndex].ticket_pdf_path = pdfPath;
      saveMockDbState();
    }
    return [{}];
  }

  // 12. UPDATE bookings SET booking_status = "Cancelled" WHERE pnr = ? AND user_id = ?
  if (normalizedSql.includes('update bookings set booking_status =')) {
    const [pnr, userId] = params;
    const bookingIndex = inMemoryDb.bookings.findIndex(x => x.pnr === pnr && x.user_id === Number(userId));
    if (bookingIndex !== -1) {
      inMemoryDb.bookings[bookingIndex].booking_status = 'Cancelled';
      saveMockDbState();
    }
    return [{}];
  }

  console.warn("Mock DB unhandled query:", sql, params);
  return [[], []];
}

const mockConnection = {
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  release: () => {},
  query: async (sql, params) => {
    return executeMockQuery(sql, params);
  }
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flyeasy_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database initialization routine (MySQL only)
export async function initDb() {
  if (isMockMode) return;
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('MySQL Connected. Initializing database schema...');

    let schemaPath = path.resolve('database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve('..', 'database', 'schema.sql');
    }

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const cleanSchemaSql = schemaSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
        .join('\n');

      const queries = cleanSchemaSql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (let query of queries) {
        await connection.query(query);
      }
      console.log('Database schema successfully checked/created.');
    }

    const [rows] = await connection.query('SELECT COUNT(*) as count FROM flights');
    if (rows[0].count === 0) {
      console.log('Flights table is empty. Seeding dummy flights...');
      let dummyPath = path.resolve('database', 'dummy_flights.sql');
      if (!fs.existsSync(dummyPath)) {
        dummyPath = path.resolve('..', 'database', 'dummy_flights.sql');
      }

      if (fs.existsSync(dummyPath)) {
        const dummySql = fs.readFileSync(dummyPath, 'utf8');
        const cleanDummySql = dummySql
          .split('\n')
          .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
          .join('\n');

        const dummyQueries = cleanDummySql
          .split(';')
          .map(q => q.trim())
          .filter(q => q.length > 0);

        for (let query of dummyQueries) {
          await connection.query(query);
        }
        console.log('Dummy flights seeded successfully.');
      }
    }
  } catch (error) {
    console.error('Database migration/init error:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

// Test connection and initialize
try {
  try {
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'flyeasy_db'}\``);
    await tempConnection.end();
  } catch (dbErr) {
    // Ignore error here
  }

  const connection = await pool.getConnection();
  console.log('MySQL Database Connected successfully to ' + (process.env.DB_NAME || 'flyeasy_db'));
  connection.release();
  await initDb();
} catch (error) {
  console.error('Database connection failed:', error.message);
  console.log('⚠️ Running in Mock Database Mode (In-memory storage with file persistence) because MySQL is not running.');
  isMockMode = true;
}

const dbProxy = {
  query: async (sql, params) => {
    if (isMockMode) {
      return executeMockQuery(sql, params);
    }
    return pool.query(sql, params);
  },
  getConnection: async () => {
    if (isMockMode) {
      return mockConnection;
    }
    return pool.getConnection();
  }
};

export default dbProxy;
