const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get All Workers
const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      workers
    });
  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve Worker
const approveWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required'
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (worker.approved) {
      return res.status(400).json({
        success: false,
        message: 'Worker is already approved'
      });
    }

    worker.approved = true;
    await worker.save();

    const updatedWorker = await Worker.findById(workerId)
      .select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'Worker approved successfully',
      worker: updatedWorker
    });
  } catch (error) {
    console.error('Approve worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Suspend User
const suspendUser = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent admin from suspending themselves
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend yourself'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.suspended) {
      return res.status(400).json({
        success: false,
        message: 'User is already suspended'
      });
    }

    user.suspended = true;
    await user.save();

    const updatedUser = await User.findById(userId)
      .select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get All Bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email')
      .populate('workerId', 'name rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get System Stats
const getSystemStats = async (req, res) => {
  try {
    // Get all stats in parallel for better performance
    const [
      totalUsers,
      totalWorkers,
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      approvedWorkers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Worker.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'pending' }),
      Worker.countDocuments({ approved: true })
    ]);

    const stats = {
      users: {
        total: totalUsers
      },
      workers: {
        total: totalWorkers,
        approved: approvedWorkers,
        pending: totalWorkers - approvedWorkers
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        pending: pendingBookings,
        active: totalBookings - completedBookings - cancelledBookings
      }
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getAllWorkers,
  approveWorker,
  suspendUser,
  getAllBookings,
  getSystemStats
};
