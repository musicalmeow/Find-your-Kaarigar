const express = require('express');
const {
  getWorkerProfile,
  updateWorkerProfile,
  getAvailableJobs,
  acceptBooking,
  rejectBooking,
  getWorkerBookings,
  updateAvailability
} = require('../controllers/workerController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply role middleware to ensure only workers can access these routes
router.use(roleMiddleware('worker'));

// Profile routes
router.get('/profile', getWorkerProfile);
router.put('/profile', updateWorkerProfile);

// Job routes
router.get('/jobs', getAvailableJobs);

// Booking action routes
router.post('/accept/:bookingId', acceptBooking);
router.post('/reject/:bookingId', rejectBooking);

// Worker bookings
router.get('/bookings', getWorkerBookings);

// Availability route
router.put('/availability', updateAvailability);

module.exports = router;
