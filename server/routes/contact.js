import express from 'express';
import { body, validationResult } from 'express-validator';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message too long'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
      }

      const { name, email, message = '' } = req.body;
      await ContactMessage.create({ name, email, message });
      res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
