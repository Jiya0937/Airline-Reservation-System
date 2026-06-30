import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to validate password strength
const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
};

// Helper to validate email format
const validateEmailFormat = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, mobile, country, city } = req.body;

    // Check required fields
    if (!fullName || !email || !password || !confirmPassword || !mobile || !country || !city) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }

    // Validate email
    if (!validateEmailFormat(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' });
    }

    // Validate password mismatch
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.'
      });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const userId = await User.create({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      country,
      city
    });

    res.status(201).json({
      message: 'Account created successfully! Redirecting to login...',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.full_name },
      process.env.JWT_SECRET || 'flyeasy_super_secret_key_12345',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        mobile: user.mobile,
        country: user.country,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.status(200).json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      mobile: user.mobile,
      country: user.country,
      city: user.city,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, mobile, country, city, oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!fullName || !mobile || !country || !city) {
      return res.status(400).json({ message: 'Profile details cannot be empty.' });
    }

    // Retrieve current user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Perform details update
    await User.updateProfile(userId, { fullName, mobile, country, city });

    // Handle password change if requested
    if (newPassword) {
      if (!oldPassword || !confirmNewPassword) {
        return res.status(400).json({ message: 'Please provide old password and confirm new password to update password.' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect old password.' });
      }

      // Check confirm password matching
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New password confirmation does not match.' });
      }

      // Validate password strength
      if (!validatePasswordStrength(newPassword)) {
        return res.status(400).json({
          message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.'
        });
      }

      // Hash and save password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await User.updatePassword(userId, hashedPassword);
    }

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: {
        id: userId,
        fullName,
        email: user.email,
        mobile,
        country,
        city
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error during profile update.' });
  }
};
