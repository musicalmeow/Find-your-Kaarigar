const Booking = require('../models/Booking');
const User = require('../models/User');
const Worker = require('../models/Worker');
const matchingService = require('../services/matchingService');

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create Booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { serviceType, location, timeSlot } = req.body;

    // Validate inputs
    if (!serviceType || !location || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: serviceType, location, timeSlot'
      });
    }

    // Find best worker using matching service
    const bestWorker = await matchingService.findBestWorker(serviceType, location, timeSlot);
    if (!bestWorker) {
      return res.status(404).json({
        success: false,
        message: 'No available workers found for the requested service and time'
      });
    }

    // Generate OTP for service verification
    const otp = generateOTP();

    // Create new booking
    const newBooking = new Booking({
      userId,
      workerId: bestWorker._id,
      serviceType,
      location,
      timeSlot,
      status: 'pending',
      otp
    });

    await newBooking.save();

    // Populate worker and user details for response
    const bookingWithDetails = await Booking.findById(newBooking._id)
      .populate('userId', 'name email')
      .populate('workerId', 'name rating skills');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        ...bookingWithDetails.toObject(),
        otp: undefined // Don't send OTP in response for security
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Booking By ID
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Fetch booking with populated details
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate('workerId', 'name rating skills');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access permissions
    const isOwner = booking.userId._id.toString() === userId;
    const isAssignedWorker = booking.workerId && booking.workerId._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAssignedWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bookings.'
      });
    }

    res.status(200).json({
      success: true,
      booking: {
        ...booking.toObject(),
        otp: undefined // Don't expose OTP
      }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update Booking Status
const updateBookingStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and status are required'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only workers can update status to "accepted"
    if (status === 'accepted') {
      if (booking.workerId && booking.workerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned worker can accept this booking'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending bookings can be accepted'
        });
      }

      // Check if booking is already taken (race condition prevention)
      const freshBooking = await Booking.findById(bookingId);
      if (freshBooking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Booking has already been accepted by another worker'
        });
      }

      booking.status = 'accepted';
      await booking.save();

      // Populate details for response
      const updatedBooking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('workerId', 'name rating skills');

      return res.status(200).json({
        success: true,
        message: 'Booking accepted successfully',
        booking: updatedBooking
      });
    }

    // Invalid status transition
    return res.status(400).json({
      success: false,
      message: 'Invalid status transition'
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only the booking owner can cancel
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking owner can cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    if (reason) {
      booking.cancellationReason = reason;
    }
    await booking.save();

    // Populate details for response
    const cancelledBooking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate('workerId', 'name rating skills');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete Booking
const completeBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId, otp } = req.body;

    if (!bookingId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and OTP are required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only the assigned worker can complete the booking
    if (!booking.workerId || booking.workerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned worker can complete this booking'
      });
    }

    // Verify OTP
    if (booking.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if booking can be completed
    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted bookings can be completed'
      });
    }

    // Update status to completed
    booking.status = 'completed';
    await booking.save();

    // Populate details for response
    const completedBooking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate('workerId', 'name rating skills');

    res.status(200).json({
      success: true,
      message: 'Booking completed successfully',
      booking: completedBooking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  completeBooking
};
