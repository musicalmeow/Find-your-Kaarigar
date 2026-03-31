const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  skills: {
    type: [String],
    required: [true, 'Skills are required'],
    validate: {
      validator: function(skills) {
        return skills.length > 0;
      },
      message: 'At least one skill is required'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be less than 0']
  },
  availability: {
    type: Boolean,
    default: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be less than 0']
  },
  approved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
workerSchema.index({ skills: 1 });
workerSchema.index({ location: 1 });
workerSchema.index({ rating: -1 });
workerSchema.index({ availability: 1 });
workerSchema.index({ approved: 1 });

// Create compound index for common queries
workerSchema.index({ skills: 1, location: 1, availability: 1 });

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
