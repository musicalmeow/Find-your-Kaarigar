const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
    minlength: [1, 'Service type cannot be empty']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  otp: {
    type: String,
    required: [true, 'OTP is required']
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
bookingSchema.index({ status: 1 });
bookingSchema.index({ workerId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ location: 1 });
bookingSchema.index({ timeSlot: 1 });

// Create compound indexes for common queries
bookingSchema.index({ status: 1, serviceType: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ workerId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
