const express = require('express');
const {
  createBooking,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  completeBooking
} = require('../controllers/bookingController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create booking - only users can create
router.post('/', roleMiddleware('user'), createBooking);

// Get booking by ID - all authenticated roles can view
router.get('/:id', getBookingById);

// Update booking status - only workers can accept
router.put('/status/:id', roleMiddleware('worker'), updateBookingStatus);

// Cancel booking - only users can cancel
router.put('/cancel/:id', roleMiddleware('user'), cancelBooking);

// Complete booking - only workers can complete
router.put('/complete/:id', roleMiddleware('worker'), completeBooking);

module.exports = router;
