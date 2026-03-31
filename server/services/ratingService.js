const Review = require('../models/Review');
const Worker = require('../models/Worker');

/**
 * Add a new rating and review for a worker
 * @param {Object} reviewData - Review information
 * @param {string} reviewData.userId - ID of the user submitting the review
 * @param {string} reviewData.workerId - ID of the worker being reviewed
 * @param {string} reviewData.bookingId - ID of the booking being reviewed
 * @param {number} reviewData.rating - Rating value (1-5)
 * @param {string} reviewData.comment - Review comment (optional)
 * @returns {Object} - Created review
 */
const addRating = async (reviewData) => {
  try {
    const { userId, workerId, bookingId, rating, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({
      userId,
      workerId,
      bookingId
    });

    if (existingReview) {
      throw new Error('Review already exists for this booking');
    }

    // Create new review
    const newReview = new Review({
      userId,
      workerId,
      bookingId,
      rating,
      comment: comment || ''
    });

    await newReview.save();

    // Update worker's average rating
    await updateWorkerRating(workerId);

    return newReview;
  } catch (error) {
    console.error('Error in addRating:', error);
    throw error;
  }
};

/**
 * Get all ratings and reviews for a worker
 * @param {string} workerId - ID of the worker
 * @returns {Object} - Worker rating information
 */
const getWorkerRatings = async (workerId) => {
  try {
    // Find all reviews for the worker
    const reviews = await Review.find({ workerId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        reviews: []
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
      ratingDistribution,
      reviews: reviews.map(review => ({
        id: review._id,
        user: review.userId.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }))
    };
  } catch (error) {
    console.error('Error in getWorkerRatings:', error);
    throw new Error('Failed to get worker ratings');
  }
};

/**
 * Update worker's average rating in the database
 * @param {string} workerId - ID of the worker to update
 * @returns {Object} - Updated worker information
 */
const updateWorkerRating = async (workerId) => {
  try {
    // Get all reviews for the worker
    const reviews = await Review.find({ workerId });
    
    if (reviews.length === 0) {
      // If no reviews, set rating to 0
      await Worker.findByIdAndUpdate(workerId, {
        rating: 0,
        totalReviews: 0
      });
      return { rating: 0, totalReviews: 0 };
    }

    // Calculate new average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update worker document
    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviews.length
      },
      { new: true }
    );

    return {
      rating: updatedWorker.rating,
      totalReviews: updatedWorker.totalReviews
    };
  } catch (error) {
    console.error('Error in updateWorkerRating:', error);
    throw new Error('Failed to update worker rating');
  }
};

/**
 * Get rating summary for multiple workers
 * @param {Array} workerIds - Array of worker IDs
 * @returns {Array} - Array of worker rating summaries
 */
const getMultipleWorkerRatings = async (workerIds) => {
  try {
    const workers = await Worker.find({ _id: { $in: workerIds } })
      .select('_id rating totalReviews');

    return workers.map(worker => ({
      workerId: worker._id,
      rating: worker.rating,
      totalReviews: worker.totalReviews
    }));
  } catch (error) {
    console.error('Error in getMultipleWorkerRatings:', error);
    throw new Error('Failed to get multiple worker ratings');
  }
};

/**
 * Delete a review (admin function)
 * @param {string} reviewId - ID of the review to delete
 * @returns {Object} - Deleted review information
 */
const deleteReview = async (reviewId) => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const workerId = review.workerId;
    await Review.findByIdAndDelete(reviewId);

    // Update worker's average rating after deletion
    await updateWorkerRating(workerId);

    return { message: 'Review deleted successfully' };
  } catch (error) {
    console.error('Error in deleteReview:', error);
    throw error;
  }
};

module.exports = {
  addRating,
  getWorkerRatings,
  updateWorkerRating,
  getMultipleWorkerRatings,
  deleteReview
};
