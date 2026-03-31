const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with the provided payload
 * @param {Object} payload - Data to include in the token (e.g., userId, role)
 * @param {Object} options - Additional JWT options (expiresIn, etc.)
 * @returns {string} - Signed JWT token
 */
const generateToken = (payload, options = {}) => {
  try {
    // Check if JWT secret is available
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Default token options
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'smart-service-system',
      audience: process.env.JWT_AUDIENCE || 'smart-service-users'
    };

    // Merge default options with provided options
    const tokenOptions = { ...defaultOptions, ...options };

    // Generate and return the token
    return jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
  } catch (error) {
    console.error('Error generating JWT token:', error.message);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @param {Object} options - Additional verification options
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token, options = {}) => {
  try {
    // Check if JWT secret is available
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Default verification options
    const defaultOptions = {
      issuer: process.env.JWT_ISSUER || 'smart-service-system',
      audience: process.env.JWT_AUDIENCE || 'smart-service-users'
    };

    // Merge default options with provided options
    const verifyOptions = { ...defaultOptions, ...options };

    // Verify and return the decoded token
    return jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token is not active yet');
    } else {
      console.error('Error verifying JWT token:', error.message);
      throw new Error('Failed to verify authentication token');
    }
  }
};

/**
 * Extract Bearer token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - Token string or null if not found
 */
const getTokenFromHeader = (req) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      return null;
    }

    // Check if header has Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract and return the token
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  } catch (error) {
    console.error('Error extracting token from header:', error.message);
    return null;
  }
};

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} - Decoded token payload (without verification)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('Error decoding JWT token:', error.message);
    throw new Error('Failed to decode token');
  }
};

/**
 * Generate refresh token with longer expiry
 * @param {Object} payload - Data to include in the refresh token
 * @returns {string} - Signed refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const refreshOptions = {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };

    return generateToken(payload, refreshOptions);
  } catch (error) {
    console.error('Error generating refresh token:', error.message);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Check if token is expired without throwing error
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired, false otherwise
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true; // Treat as expired if no exp claim
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // Treat as expired if decoding fails
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader,
  decodeToken,
  generateRefreshToken,
  isTokenExpired
};
