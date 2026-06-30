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
    tags VARCHAR(255)
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
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(10) UNIQUE NOT NULL,
    flight_id INT,
    cabin_class VARCHAR(50) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Confirmed', 'Pending', 'Cancelled') DEFAULT 'Confirmed',
    FOREIGN KEY (flight_id) REFERENCES flights(id)
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

