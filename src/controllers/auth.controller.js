const AuthService = require('../services/auth.service');
const { trackEvent, trackException, trackMetric } = require('../config/appInsights');

class AuthController {
  static async register(req, res, next) {
    const startTime = Date.now();
    try {
      const { name, handle, email, password, artistType } = req.body;
      
      if (!name || !handle || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await AuthService.register({
        name,
        handle,
        email,
        password,
        artistType
      });

      const duration = Date.now() - startTime;
      
      trackEvent('UserRegister', {
        userId: result.user.id,
        email: result.user.email,
        artistType: result.user.artistType,
        duration,
        success: true,
      });
      
      trackMetric('UserRegisterDuration', duration);

      res.status(201).json(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('UserRegister', {
        email: req.body.email,
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'register', email: req.body.email });
      
      next(error);
    }
  }

  static async login(req, res, next) {
    const startTime = Date.now();
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);
      const duration = Date.now() - startTime;
      
      trackEvent('UserLogin', {
        userId: result.user.id,
        email: result.user.email,
        duration,
        success: true,
      });
      
      trackMetric('UserLoginDuration', duration);

      res.json(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('UserLogin', {
        email: req.body.email,
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'login', email: req.body.email });
      
      next(error);
    }
  }
}

module.exports = AuthController;

