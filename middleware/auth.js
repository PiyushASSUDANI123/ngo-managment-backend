const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Volunteer = require('../models/Volunteer');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }
      req.user = { ...admin.toObject(), role: 'admin' };
    } else if (decoded.role === 'volunteer') {
      const volunteer = await Volunteer.findById(decoded.id).select('-password');
      if (!volunteer) {
        return res.status(401).json({ message: 'Volunteer not found' });
      }
      if (volunteer.status === 'inactive') {
        return res.status(401).json({ message: 'Your account has been suspended. Please contact the administrator.' });
      }
      req.user = { ...volunteer.toObject(), role: 'volunteer' };
    } else {
      return res.status(401).json({ message: 'Invalid token role' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { protect, adminOnly };
