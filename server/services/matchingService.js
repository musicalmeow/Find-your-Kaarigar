const Worker = require('../models/Worker');

/**
 * Find the best worker for a specific service request
 * @param {string} serviceType - The type of service required
 * @param {string} location - The location where service is needed
 * @param {string} timeSlot - The preferred time slot
 * @returns {Object|null} - Best matched worker or null if no match found
 */
const findBestWorker = async (serviceType, location, timeSlot) => {
  try {
    // Build query for matching workers
    const query = {
      skills: serviceType, // Worker has the required skill
      approved: true, // Worker is approved by admin
      availability: true // Worker is currently available
    };

    // Find workers matching the criteria
    const matchingWorkers = await Worker.find(query)
      .sort({ rating: -1 }) // Sort by rating (highest first)
      .limit(10); // Limit to top 10 candidates

    if (matchingWorkers.length === 0) {
      return null;
    }

    // If location is provided, prioritize workers in same location
    if (location) {
      const locationWorkers = matchingWorkers.filter(worker => 
        worker.location && 
        (worker.location.toLowerCase().includes(location.toLowerCase()) ||
         location.toLowerCase().includes(worker.location.toLowerCase()))
      );

      // Return highest rated worker from matching location, or highest rated overall
      return locationWorkers.length > 0 ? locationWorkers[0] : matchingWorkers[0];
    }

    // Return highest rated worker
    return matchingWorkers[0];
  } catch (error) {
    console.error('Error in findBestWorker:', error);
    throw new Error('Failed to find matching worker');
  }
};

/**
 * Find multiple matching workers based on user preferences
 * @param {Object} preferences - User preferences for matching
 * @param {string} preferences.serviceType - Required service type
 * @param {string} preferences.location - Preferred location (optional)
 * @param {number} preferences.limit - Maximum number of workers to return (default: 5)
 * @param {number} preferences.minRating - Minimum rating requirement (optional)
 * @returns {Array} - List of suitable workers sorted by relevance
 */
const findMatchingWorkers = async (preferences) => {
  try {
    const { 
      serviceType, 
      location, 
      limit = 5, 
      minRating = 0 
    } = preferences;

    if (!serviceType) {
      throw new Error('Service type is required for worker matching');
    }

    // Build base query
    const query = {
      skills: serviceType,
      approved: true,
      availability: true,
      rating: { $gte: minRating }
    };

    // Find matching workers
    let workers = await Worker.find(query)
      .sort({ rating: -1 })
      .limit(limit * 2); // Get more to allow for location filtering

    // Apply location filtering if specified
    if (location && workers.length > 0) {
      const locationWorkers = workers.filter(worker => 
        worker.location && 
        (worker.location.toLowerCase().includes(location.toLowerCase()) ||
         location.toLowerCase().includes(worker.location.toLowerCase()))
      );

      // Prioritize location matches, but include others if needed
      const otherWorkers = workers.filter(worker => 
        !locationWorkers.includes(worker)
      );

      workers = [...locationWorkers, ...otherWorkers];
    }

    // Return limited number of workers
    return workers.slice(0, limit);
  } catch (error) {
    console.error('Error in findMatchingWorkers:', error);
    throw new Error('Failed to find matching workers');
  }
};

/**
 * Check if a worker is available for a specific time slot
 * @param {string} workerId - ID of the worker to check
 * @param {string} timeSlot - Time slot to check availability for
 * @returns {boolean} - True if worker is available
 */
const checkWorkerAvailability = async (workerId, timeSlot) => {
  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Check if worker is marked as available
    if (!worker.availability) {
      return false;
    }

    // Additional time slot availability logic can be added here
    // For now, return true if worker is generally available
    return true;
  } catch (error) {
    console.error('Error in checkWorkerAvailability:', error);
    throw new Error('Failed to check worker availability');
  }
};

module.exports = {
  findBestWorker,
  findMatchingWorkers,
  checkWorkerAvailability
};
