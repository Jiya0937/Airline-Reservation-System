// Seed script loader for FlyEasy (Mock seed simulation)
import fs from 'fs';
import path from 'path';

console.log("Initializing database seed scripts...");

try {
  const schemaPath = path.resolve('database', 'schema.sql');
  const dummyPath = path.resolve('database', 'dummy_flights.sql');

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const dummyContent = fs.readFileSync(dummyPath, 'utf8');

  console.log("Successfully read database schemas and mock seeds.");
  console.log("Seeding simulation finished successfully on flyeasy_db database local mock.");
} catch (err) {
  console.error("Database Seeding Error:", err.message);
}
