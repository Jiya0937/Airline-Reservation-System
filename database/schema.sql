-- SQL Schema for FlyEasy Airline Reservation System

CREATE DATABASE IF NOT EXISTS flyeasy_db;
USE flyeasy_db;

-- Flights Schedule Table
CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    airline VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20) UNIQUE NOT NULL,
    aircraft VARCHAR(100) NOT NULL,
    origin VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration VARCHAR(20) NOT NULL,
    stops INT DEFAULT 0,
    refundable BOOLEAN DEFAULT TRUE,
    tags VARCHAR(255),
    available_seats INT DEFAULT 60
);

-- Cabin Class Pricing Table
CREATE TABLE IF NOT EXISTS flight_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT,
    cabin_class ENUM('Economy', 'Premium Economy', 'Business Class', 'First Class') NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- Bookings Table
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(10) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    departure VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    meal VARCHAR(50) NOT NULL,
    fare DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    booking_status VARCHAR(50) DEFAULT 'Confirmed',
    ticket_pdf_path VARCHAR(255),
    terminal VARCHAR(20),
    gate VARCHAR(20),
    transaction_id VARCHAR(100),
    cabin_class VARCHAR(50),
    gender VARCHAR(20),
    dob DATE,
    nationality VARCHAR(100),
    passport_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

