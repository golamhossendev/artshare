const User = require('../models/User');

class UserController {
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.getById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove password hash
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;

