-- Dummy SQL inserts for flights and class prices in FlyEasy Reservation Database

USE flyeasy_db;

-- Clear tables first
DELETE FROM flight_prices;
DELETE FROM flights;

-- Insert Flights
INSERT INTO flights (id, airline, flight_number, aircraft, origin, destination, departure_time, arrival_time, duration, stops, refundable, tags) VALUES
(1, 'FlyEasy Airways', 'FE-201', 'Airbus A350-900', 'Delhi (DEL)', 'Mumbai (BOM)', '06:00:00', '08:15:00', '2h 15m', 0, TRUE, 'Best Value,Cheapest'),
(2, 'IndiGo', '6E-512', 'Airbus A320neo', 'Delhi (DEL)', 'Mumbai (BOM)', '07:30:00', '09:45:00', '2h 15m', 0, FALSE, 'Cheapest'),
(3, 'Air India', 'AI-805', 'Boeing 787-8 Dreamliner', 'Delhi (DEL)', 'Mumbai (BOM)', '10:00:00', '12:15:00', '2h 15m', 0, TRUE, 'Best Value'),
(4, 'Vistara', 'UK-985', 'Boeing 787-9', 'Delhi (DEL)', 'Mumbai (BOM)', '15:45:00', '18:00:00', '2h 15m', 0, TRUE, 'Fastest'),
(5, 'Emirates', 'EK-506', 'Boeing 777-300ER', 'Delhi (DEL)', 'Mumbai (BOM)', '21:30:00', '23:55:00', '2h 25m', 0, TRUE, 'Best Value');

-- Insert Class Prices
INSERT INTO flight_prices (flight_id, cabin_class, original_price, discounted_price) VALUES
(1, 'Economy', 6500.00, 4999.00),
(1, 'Premium Economy', 9000.00, 7200.00),
(1, 'Business Class', 18000.00, 14500.00),
(2, 'Economy', 5800.00, 4500.00),
(2, 'Premium Economy', 8000.00, 6500.00),
(2, 'Business Class', 16000.00, 13000.00),
(3, 'Economy', 7200.00, 5500.00),
(3, 'Premium Economy', 10000.00, 8000.00),
(3, 'Business Class', 22000.00, 17500.00),
(4, 'Economy', 8500.00, 6800.00),
(4, 'Premium Economy', 12000.00, 9500.00),
(4, 'Business Class', 25000.00, 20000.00),
(5, 'Economy', 14000.00, 11200.00),
(5, 'Premium Economy', 21000.00, 16800.00),
(5, 'Business Class', 48000.00, 38400.00);
