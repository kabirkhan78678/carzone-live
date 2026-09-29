import express from 'express';
import userRoutes from './user.js';
import adminRoutes from './admin.js'
import eurotaxRoutes from './eurotax.js';
import vehiclesRoutes from './vehicles.js';
import { getApiRateLimiter } from '../middleware/rateLimiter.js';
import { getRequestLanguage } from '../utils/responseHandler.js';

const router = express.Router();

// Initialize request language
router.use((req, res, next) => {
  res.locals.language = getRequestLanguage(req);
  req.language = res.locals.language;
  next();
});

// Apply rate limiter to all incoming GET requests
router.use((req, res, next) => {
  if (req.method === 'GET') {
    return getApiRateLimiter(req, res, next);
  }
  next();
});

router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/eurotax', eurotaxRoutes);
router.use('/carapi', vehiclesRoutes);

export default router;