const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_stock_secret_key_2026';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Expect Bearer <token>
  const tokenParts = authHeader.split(' ');
  const token = tokenParts[0] === 'Bearer' ? tokenParts[1] : tokenParts[0];

  if (!token) {
    return res.status(401).json({ message: 'Token formatting error, access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware;
