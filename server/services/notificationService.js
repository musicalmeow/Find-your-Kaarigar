const Notification = require('../models/Notification');

/**
 * Send a notification to a user
 * @param {Object} notificationData - Notification information
 * @param {string} notificationData.userId - ID of the user to notify
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Type of notification (info, success, warning, error)
 * @param {string} notificationData.title - Notification title (optional)
 * @param {Object} notificationData.data - Additional data (optional)
 * @returns {Object} - Created notification
 */
const sendNotification = async (notificationData) => {
  try {
    const { userId, message, type, title, data } = notificationData;

    // Validate required fields
    if (!userId || !message || !type) {
      throw new Error('userId, message, and type are required');
    }

    // Validate notification type
    const validTypes = ['info', 'success', 'warning', 'error'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid notification type. Must be: info, success, warning, or error');
    }

    // Create new notification
    const newNotification = new Notification({
      userId,
      message,
      type,
      title: title || 'Notification',
      data: data || {},
      isRead: false
    });

    await newNotification.save();

    return newNotification;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - ID of the user
 * @param {Object} options - Query options
 * @param {boolean} options.unreadOnly - Get only unread notifications (default: false)
 * @param {number} options.limit - Maximum number of notifications to return (default: 20)
 * @param {number} options.page - Page number for pagination (default: 1)
 * @returns {Object} - Notifications with pagination info
 */
const getNotifications = async (userId, options = {}) => {
  try {
    const { unreadOnly = false, limit = 20, page = 1 } = options;

    // Build query
    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      notifications,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  } catch (error) {
    console.error('Error in getNotifications:', error);
    throw new Error('Failed to get notifications');
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @param {string} userId - ID of the user (for authorization)
 * @returns {Object} - Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId }, // Ensure user owns the notification
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return notification;
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - ID of the user
 * @returns {Object} - Update result
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return {
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 * @param {string} userId - ID of the user (for authorization)
 * @returns {Object} - Deletion result
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId // Ensure user owns the notification
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return { message: 'Notification deleted successfully' };
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw error;
  }
};

/**
 * Send booking-related notifications
 * @param {string} type - Type of booking notification
 * @param {Object} data - Booking data
 * @returns {Object} - Created notification
 */
const sendBookingNotification = async (type, data) => {
  try {
    const { userId, workerId, bookingId, serviceType } = data;
    let notificationData = {};

    switch (type) {
      case 'booking_created':
        notificationData = {
          userId: workerId,
          message: `New booking request for ${serviceType}`,
          type: 'info',
          title: 'New Booking Request',
          data: { bookingId, serviceType }
        };
        break;

      case 'booking_accepted':
        notificationData = {
          userId,
          message: `Your ${serviceType} booking has been accepted`,
          type: 'success',
          title: 'Booking Accepted',
          data: { bookingId, serviceType }
        };
        break;

      case 'booking_cancelled':
        notificationData = {
          userId: workerId,
          message: `A ${serviceType} booking has been cancelled`,
          type: 'warning',
          title: 'Booking Cancelled',
          data: { bookingId, serviceType }
        };
        break;

      case 'booking_completed':
        notificationData = {
          userId,
          message: `Your ${serviceType} booking has been completed. Please leave a review!`,
          type: 'success',
          title: 'Booking Completed',
          data: { bookingId, serviceType }
        };
        break;

      default:
        throw new Error('Invalid booking notification type');
    }

    return await sendNotification(notificationData);
  } catch (error) {
    console.error('Error in sendBookingNotification:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 * @param {string} userId - ID of the user
 * @returns {Object} - Notification statistics
 */
const getNotificationStats = async (userId) => {
  try {
    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
      Notification.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const typeStats = {};
    byType.forEach(item => {
      typeStats[item._id] = item.count;
    });

    return {
      total,
      unread,
      read: total - unread,
      byType: typeStats
    };
  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    throw new Error('Failed to get notification statistics');
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBookingNotification,
  getNotificationStats
};
