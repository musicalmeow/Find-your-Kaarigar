const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Worker = require('../models/Worker');
const matchingService = require('../services/matchingService');
const ratingService = require('../services/ratingService');

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    // Validate input
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or email) is required'
      });
    }

    // Check if email is being updated and already exists
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create Booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { serviceType, location, timeSlot } = req.body;

    // Validate input
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

    // Create new booking
    const newBooking = new Booking({
      userId,
      workerId: bestWorker._id,
      serviceType,
      location,
      timeSlot,
      status: 'pending'
    });

    await newBooking.save();

    // Populate worker details for response
    const bookingWithWorker = await Booking.findById(newBooking._id)
      .populate('workerId', 'name rating skills');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: bookingWithWorker
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get User Bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({ userId })
      .populate('workerId', 'name rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit Review
const submitReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workerId, rating, comment } = req.body;

    // Validate input
    if (!workerId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'workerId and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check if user has completed booking with this worker
    const completedBooking = await Booking.findOne({
      userId,
      workerId,
      status: 'completed'
    });

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: 'You can only review workers after completing a booking with them'
      });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      userId,
      workerId,
      bookingId: completedBooking._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this worker for this booking'
      });
    }

    // Create new review
    const newReview = new Review({
      userId,
      workerId,
      bookingId: completedBooking._id,
      rating,
      comment: comment || ''
    });

    await newReview.save();

    // Update worker rating using rating service
    await ratingService.updateWorkerRating(workerId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  createBooking,
  getUserBookings,
  submitReview
};
