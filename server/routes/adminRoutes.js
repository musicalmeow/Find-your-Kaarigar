const express = require('express');
const {
  getAllUsers,
  getAllWorkers,
  approveWorker,
  suspendUser,
  getAllBookings,
  getSystemStats
} = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// User management routes
router.get('/users', getAllUsers);

// Worker management routes
router.get('/workers', getAllWorkers);
router.put('/workers/approve/:id', approveWorker);

// User suspension route
router.put('/users/suspend/:id', suspendUser);

// Booking management route
router.get('/bookings', getAllBookings);

// System statistics route
router.get('/stats', getSystemStats);

module.exports = router;
