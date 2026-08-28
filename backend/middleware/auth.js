const jwt = require('jsonwebtoken');

// ─── VERIFY JWT TOKEN ─────────────────────────────
const verifyToken = (req, res, next) => {

  // Get token from header
  const authHeader = req.headers['authorization'];

  // Check if token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided. Access denied.'
    });
  }

  // Extract token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  try {
    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    // Allow request to continue
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(401).json({
      message: 'Invalid token. Access denied.'
    });
  }
};

// ─── VERIFY ADMIN ROLE ────────────────────────────
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'lender') {
    return res.status(403).json({
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
