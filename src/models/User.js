const { containers } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.handle = data.handle.replace('@', ''); // Remove @ if present
    this.email = data.email.toLowerCase();
    this.passwordHash = data.passwordHash;
    this.artistType = data.artistType || null;
    this.contact = data.contact || null;
    this.socialLinks = data.socialLinks || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Get user container
  static getContainer() {
    return containers.users;
  }

  // Create user
  static async create(userData) {
    const user = new User(userData);
    const container = this.getContainer();
    const { resource } = await container.items.create(user);
    return resource;
  }

  // Get user by ID
  static async getById(id) {
    const container = this.getContainer();
    try {
      const { resource } = await container.item(id, id).read();
      return resource;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  // Get user by email
  static async getByEmail(email) {
    const container = this.getContainer();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources[0] || null;
  }

  // Get user by handle
  static async getByHandle(handle) {
    const container = this.getContainer();
    const handleClean = handle.replace('@', '');
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.handle = @handle',
      parameters: [{ name: '@handle', value: handleClean }]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources[0] || null;
  }

  // Update user
  static async update(id, updates) {
    const container = this.getContainer();
    const user = await this.getById(id);
    if (!user) throw new Error('User not found');
    
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const { resource } = await container.item(id, id).replace(updated);
    return resource;
  }

  // Convert to public format (without password)
  toPublic() {
    const { passwordHash, ...publicUser } = this;
    return publicUser;
  }
}

module.exports = User;

