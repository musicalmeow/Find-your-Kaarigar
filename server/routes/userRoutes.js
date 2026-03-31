const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  createBooking,
  getUserBookings,
  submitReview
} = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply role middleware to ensure only users can access these routes
router.use(roleMiddleware('user'));

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getUserBookings);

// Review route
router.post('/reviews', submitReview);

module.exports = router;
