const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get Worker Profile
const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.user.userId;

    const worker = await Worker.findById(workerId).select('-password -__v');
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      worker: {
        id: worker._id,
        name: worker.name,
        skills: worker.skills,
        rating: worker.rating,
        availability: worker.availability,
        experience: worker.experience,
        location: worker.location
      }
    });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update Worker Profile
const updateWorkerProfile = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { skills, location, availability, experience } = req.body;

    // Validate at least one field is provided
    if (!skills && !location && availability === undefined && !experience) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (skills) updateData.skills = skills;
    if (location) updateData.location = location;
    if (availability !== undefined) updateData.availability = availability;
    if (experience) updateData.experience = experience;

    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'Worker profile updated successfully',
      worker: {
        id: updatedWorker._id,
        name: updatedWorker.name,
        skills: updatedWorker.skills,
        rating: updatedWorker.rating,
        availability: updatedWorker.availability,
        experience: updatedWorker.experience,
        location: updatedWorker.location
      }
    });
  } catch (error) {
    console.error('Update worker profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Available Jobs
const getAvailableJobs = async (req, res) => {
  try {
    const workerId = req.user.userId;

    // Get worker details for filtering
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check if worker is available
    if (!worker.availability) {
      return res.status(200).json({
        success: true,
        message: 'Worker is currently unavailable',
        jobs: []
      });
    }

    // Find pending bookings that match worker's skills and location
    const availableJobs = await Booking.find({
      status: 'pending',
      workerId: { $exists: false }
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

    // Filter jobs based on worker's skills and location
    const relevantJobs = availableJobs.filter(booking => {
      // Check if service type matches worker's skills
      const skillMatch = worker.skills.includes(booking.serviceType);
      
      // Basic location match (can be enhanced with proximity calculation)
      const locationMatch = !worker.location || 
                           booking.location.toLowerCase().includes(worker.location.toLowerCase()) ||
                           worker.location.toLowerCase().includes(booking.location.toLowerCase());

      return skillMatch && locationMatch;
    });

    res.status(200).json({
      success: true,
      jobs: relevantJobs
    });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Accept Booking
const acceptBooking = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Check if worker is available
    const worker = await Worker.findById(workerId);
    if (!worker || !worker.availability) {
      return res.status(400).json({
        success: false,
        message: 'Worker is not available to accept jobs'
      });
    }

    // Find the booking and ensure it's still pending
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer available'
      });
    }

    if (booking.workerId) {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been accepted by another worker'
      });
    }

    // Assign worker and update status
    booking.workerId = workerId;
    booking.status = 'accepted';
    await booking.save();

    // Populate user details for response
    const updatedBooking = await Booking.findById(bookingId)
      .populate('userId', 'name')
      .populate('workerId', 'name rating');

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject Booking
const rejectBooking = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { bookingId } = req.body;

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

    // Worker can only reject if they were assigned or if it's pending
    if (booking.workerId && booking.workerId.toString() !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject bookings assigned to you'
      });
    }

    // Optional: Log rejection for analytics
    // This could be enhanced with rejection reasons, etc.

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully'
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Worker Bookings
const getWorkerBookings = async (req, res) => {
  try {
    const workerId = req.user.userId;

    const bookings = await Booking.find({ workerId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get worker bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update Availability
const updateAvailability = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { availability } = req.body;

    if (typeof availability !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Availability must be a boolean value'
      });
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      { availability },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedWorker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Worker availability updated to ${availability ? 'available' : 'unavailable'}`,
      worker: {
        id: updatedWorker._id,
        name: updatedWorker.name,
        skills: updatedWorker.skills,
        rating: updatedWorker.rating,
        availability: updatedWorker.availability,
        experience: updatedWorker.experience,
        location: updatedWorker.location
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getWorkerProfile,
  updateWorkerProfile,
  getAvailableJobs,
  acceptBooking,
  rejectBooking,
  getWorkerBookings,
  updateAvailability
};
