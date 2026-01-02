const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

class AuthService {
  // Register new user
  static async register(userData) {
    const { name, handle, email, password, artistType } = userData;

    // Check if user already exists
    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingHandle = await User.getByHandle(handle);
    if (existingHandle) {
      throw new Error('User with this handle already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      handle,
      email,
      passwordHash,
      artistType
    });

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  // Login user
  static async login(email, password) {
    const user = await User.getByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry || '24h' }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get user from token
  static async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    const user = await User.getById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = AuthService;

