/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 * Must be used after authMiddleware to ensure req.user exists
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const roleMiddleware = (...allowedRoles) => {
  // Validate that at least one role is provided
  if (allowedRoles.length === 0) {
    throw new Error('At least one role must be specified for roleMiddleware');
  }

  return (req, res, next) => {
    try {
      // Check if user exists (should be set by authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Check if user has a role
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'User role not defined. Access denied.'
        });
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${req.user.role}.`
        });
      }

      // User has required role, continue to next middleware
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};

/**
 * Middleware to check if user is an admin
 * Shortcut for roleMiddleware('admin')
 */
const adminOnly = roleMiddleware('admin');

/**
 * Middleware to check if user is a regular user
 * Shortcut for roleMiddleware('user')
 */
const userOnly = roleMiddleware('user');

/**
 * Middleware to check if user is a worker
 * Shortcut for roleMiddleware('worker')
 */
const workerOnly = roleMiddleware('worker');

/**
 * Middleware to allow multiple roles (user or worker)
 * Common for routes that both users and workers can access
 */
const userOrWorker = roleMiddleware('user', 'worker');

/**
 * Middleware to allow any authenticated user
 * Checks only if user is authenticated, regardless of role
 */
const anyAuthenticated = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // User is authenticated, regardless of role
    next();
  } catch (error) {
    console.error('Any authenticated middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization.'
    });
  }
};

/**
 * Middleware to check if user can access their own resource or is admin
 * Useful for routes where users can only access their own data, but admins can access all
 * 
 * @param {string} userIdParam - Name of the parameter containing the user ID (default: 'id')
 * @returns {Function} Express middleware function
 */
const ownerOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      const targetUserId = req.params[userIdParam];
      const currentUserId = req.user.userId.toString();
      const isAdmin = req.user.role === 'admin';

      // Allow access if user is admin or accessing their own resource
      if (isAdmin || currentUserId === targetUserId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      console.error('Owner or admin middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};

module.exports = {
  roleMiddleware,
  adminOnly,
  userOnly,
  workerOnly,
  userOrWorker,
  anyAuthenticated,
  ownerOrAdmin
};
