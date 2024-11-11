module.exports = (req, res, next) => {
    if (req.method === 'POST' && req.path === '/api/login') {
      const { username, password } = req.body;
      const user = req.app.db.get('users').find({ username, password }).value();
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Generowanie tokenu JWT
      const token = 'mock-jwt-token';
      return res.status(200).json({ token });
    }
    next();
  };
  