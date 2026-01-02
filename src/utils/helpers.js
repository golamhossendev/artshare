// Helper functions

module.exports = {
  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Sanitize input
  sanitize: (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  }
};

