import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database file inside backend folder
const dbPath = path.resolve(__dirname, '..', 'airline.db');

console.log('Connecting to SQLite Database at:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Successfully connected to SQLite database.');
  }
});

// Enable foreign key constraints in SQLite
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('Error enabling foreign keys:', err.message);
  }
});

// Helper function to execute queries and return a promise matching the [results/rows] interface of mysql2
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const trimmedSql = sql.trim().toLowerCase();
    
    // Check if the query is a select/read query or utility statement
    if (
      trimmedSql.startsWith('select') ||
      trimmedSql.startsWith('pragma') ||
      trimmedSql.startsWith('show') ||
      trimmedSql.startsWith('explain')
    ) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve([rows, []]);
        }
      });
    } else {
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          // Return insertion id and affected rows
          resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
        }
      });
    }
  });
}

// Chaining lock logic to serialize concurrent transactions and prevent SQLITE_BUSY / query interleaving
let dbLockPromise = Promise.resolve();

async function acquireLock() {
  let release;
  const newLock = new Promise((resolve) => {
    release = resolve;
  });
  const previousLock = dbLockPromise;
  dbLockPromise = newLock;
  await previousLock;
  return release;
}

const dbProxy = {
  query: async (sql, params) => {
    return query(sql, params);
  },
  getConnection: async () => {
    const release = await acquireLock();
    return {
      query: async (sql, params) => {
        try {
          return await query(sql, params);
        } catch (err) {
          throw err;
        }
      },
      beginTransaction: async () => {
        return query('BEGIN TRANSACTION');
      },
      commit: async () => {
        return query('COMMIT');
      },
      rollback: async () => {
        return query('ROLLBACK');
      },
      release: () => {
        release();
      }
    };
  }
};

// Database Schema Table creation queries
const tableQueries = [
  `CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airline TEXT NOT NULL,
      flight_number TEXT UNIQUE NOT NULL,
      aircraft TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      stops INTEGER DEFAULT 0,
      refundable INTEGER DEFAULT 1,
      tags TEXT,
      available_seats INTEGER DEFAULT 60
  )`,
  `CREATE TABLE IF NOT EXISTS flight_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id INTEGER,
      cabin_class TEXT NOT NULL,
      original_price DECIMAL(10, 2) NOT NULL,
      discounted_price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      mobile TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
      booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      flight_id INTEGER NOT NULL,
      passenger_name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile TEXT NOT NULL,
      departure TEXT NOT NULL,
      destination TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      meal TEXT NOT NULL,
      fare DECIMAL(10, 2) NOT NULL,
      payment_status TEXT DEFAULT 'Paid',
      booking_status TEXT DEFAULT 'Confirmed',
      ticket_pdf_path TEXT,
      terminal TEXT,
      gate TEXT,
      transaction_id TEXT,
      cabin_class TEXT,
      gender TEXT,
      dob TEXT,
      nationality TEXT,
      passport_number TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
  )`
];

// Initialize database schema tables and seed dummy flights data if empty
export async function initDb() {
  try {
    // Run schema creation statements sequentially
    for (const q of tableQueries) {
      await dbProxy.query(q);
    }
    console.log('SQLite schema tables verified/created.');

    // Check if flights are empty, seed mock flights if they are
    const [rows] = await dbProxy.query('SELECT COUNT(*) as count FROM flights');
    if (rows[0].count === 0) {
      console.log('Flights database is empty. Inserting dummy flights...');

      const flightsDummy = [
        [1, 'FlyEasy Airways', 'FE 201', 'Airbus A350-900', 'Delhi (DEL)', 'Mumbai (BOM)', '09:55:00', '12:05:00', '2h 10m', 0, 1, 'Recommended'],
        [2, 'Air India', 'AI 302', 'Boeing 787-8 Dreamliner', 'Delhi (DEL)', 'Mumbai (BOM)', '11:20:00', '13:40:00', '2h 20m', 0, 1, 'Cheapest'],
        [3, 'IndiGo', '6E 701', 'Airbus A320neo', 'Delhi (DEL)', 'Mumbai (BOM)', '14:15:00', '16:20:00', '2h 05m', 0, 0, 'Cheapest,Fastest'],
        [4, 'Emirates', 'EK 110', 'Boeing 777-300ER', 'Delhi (DEL)', 'Mumbai (BOM)', '18:45:00', '21:00:00', '2h 15m', 0, 1, 'Recommended'],
        [5, 'Vistara', 'UK 425', 'Boeing 787-9', 'Delhi (DEL)', 'Mumbai (BOM)', '08:00:00', '10:15:00', '2h 15m', 0, 1, 'Recommended'],
        [6, 'FlyEasy Airways', 'FE 205', 'Airbus A350-900', 'Delhi (DEL)', 'Mumbai (BOM)', '16:30:00', '20:45:00', '4h 15m', 1, 1, 'Cheapest'],
        [7, 'Air India', 'AI 820', 'Boeing 787-8 Dreamliner', 'Delhi (DEL)', 'Mumbai (BOM)', '20:00:00', '22:15:00', '2h 15m', 0, 1, ''],
        [8, 'Vistara', 'UK 902', 'Boeing 787-9', 'Delhi (DEL)', 'Mumbai (BOM)', '22:30:00', '00:45:00', '2h 15m', 0, 1, '']
      ];

      for (const flight of flightsDummy) {
        await dbProxy.query(
          `INSERT INTO flights (id, airline, flight_number, aircraft, origin, destination, departure_time, arrival_time, duration, stops, refundable, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          flight
        );
      }

      const pricesDummy = [
        [1, 'Economy', 6500.00, 4999.00],
        [1, 'Premium Economy', 9000.00, 7200.00],
        [1, 'Business Class', 18000.00, 14500.00],
        [2, 'Economy', 5800.00, 4500.00],
        [2, 'Premium Economy', 8000.00, 6500.00],
        [2, 'Business Class', 16000.00, 13000.00],
        [3, 'Economy', 7200.00, 5500.00],
        [3, 'Premium Economy', 10000.00, 8000.00],
        [3, 'Business Class', 22000.00, 17500.00],
        [4, 'Economy', 8500.00, 6800.00],
        [4, 'Premium Economy', 12000.00, 9500.00],
        [4, 'Business Class', 25000.00, 20000.00],
        [5, 'Economy', 14000.00, 11200.00],
        [5, 'Premium Economy', 21000.00, 16800.00],
        [5, 'Business Class', 48000.00, 38400.00],
        [6, 'Economy', 6200.00, 4600.00],
        [6, 'Premium Economy', 8500.00, 6800.00],
        [6, 'Business Class', 17000.00, 13600.00],
        [7, 'Economy', 7100.00, 5600.00],
        [7, 'Premium Economy', 9500.00, 7600.00],
        [7, 'Business Class', 19000.00, 15200.00],
        [8, 'Economy', 7800.00, 6200.00],
        [8, 'Premium Economy', 10500.00, 8400.00],
        [8, 'Business Class', 21000.00, 16800.00]
      ];

      for (const price of pricesDummy) {
        await dbProxy.query(
          `INSERT INTO flight_prices (flight_id, cabin_class, original_price, discounted_price) VALUES (?, ?, ?, ?)`,
          price
        );
      }
      console.log('Dummy flights and prices seeding completed.');
    }
  } catch (error) {
    console.error('Database migration/init error:', error.message);
  }
}

// Automatically invoke database tables verification & seeding on import
await initDb();

export default dbProxy;
