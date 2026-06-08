import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwt.js';

export function protect(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('-password');
    if (user) req.user = user;
  } catch {
    // Invalid token — treat as anonymous
  }
  next();
}

export async function attachUser(req, res, next) {
  try {
    if (!req.userId) return next();
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function roleProtect(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}