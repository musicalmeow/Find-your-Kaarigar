# Find your Kaarigar (Smart Service Allocation and Booking System) - Backend API

A comprehensive Node.js + Express backend for a smart service allocation and booking system with MongoDB database, JWT authentication, and role-based access control.

## 🚀 Features

- **User Authentication**: JWT-based registration and login system
- **Role-Based Access Control**: User, Worker, and Admin roles with specific permissions
- **Service Booking**: Complete booking lifecycle with OTP verification
- **Worker Matching**: Intelligent worker matching based on skills, location, and ratings
- **Review System**: Rating and review system for workers
- **Admin Panel**: User management, worker approval, and system statistics
- **Real-time Notifications**: Notification system for booking updates
- **RESTful API**: Clean and well-documented API endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fswd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000

   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/smart-service-system

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   JWT_ISSUER=smart-service-system
   JWT_AUDIENCE=smart-service-users
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # For MongoDB installed locally
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js           # Database connection configuration
│   └── jwt.js          # JWT utilities and configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── workerController.js  # Worker management
│   ├── bookingController.js # Booking management
│   └── adminController.js  # Admin operations
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   └── roleMiddleware.js   # Role-based authorization
├── models/
│   ├── User.js         # User schema
│   ├── Worker.js       # Worker schema
│   ├── Booking.js      # Booking schema
│   └── Review.js       # Review schema
├── routes/
│   ├── authRoutes.js   # Authentication routes
│   ├── userRoutes.js   # User routes
│   ├── workerRoutes.js  # Worker routes
│   ├── bookingRoutes.js # Booking routes
│   └── adminRoutes.js  # Admin routes
├── services/
│   ├── matchingService.js    # Worker matching logic
│   ├── ratingService.js     # Rating and review logic
│   └── notificationService.js # Notification system
├── app.js              # Express app configuration
└── server.js           # Server startup and execution
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### User Routes (Role: user)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/bookings` - Create booking
- `GET /api/users/bookings` - Get user bookings
- `POST /api/users/reviews` - Submit review

### Worker Routes (Role: worker)
- `GET /api/workers/profile` - Get worker profile
- `PUT /api/workers/profile` - Update worker profile
- `GET /api/workers/jobs` - Get available jobs
- `POST /api/workers/accept/:bookingId` - Accept booking
- `POST /api/workers/reject/:bookingId` - Reject booking
- `GET /api/workers/bookings` - Get worker bookings
- `PUT /api/workers/availability` - Update availability

### Booking Routes (Mixed Roles)
- `POST /api/bookings` - Create booking (users)
- `GET /api/bookings/:id` - Get booking details (all roles)
- `PUT /api/bookings/status/:id` - Update booking status (workers)
- `PUT /api/bookings/cancel/:id` - Cancel booking (users)
- `PUT /api/bookings/complete/:id` - Complete booking (workers)

### Admin Routes (Role: admin)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/workers` - Get all workers
- `PUT /api/admin/workers/approve/:id` - Approve worker
- `PUT /api/admin/users/suspend/:id` - Suspend user
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/stats` - Get system statistics

### System
- `GET /api/health` - Health check
- `GET /api` - API documentation

## 🎯 User Roles

### User
- Register and login
- Create and manage bookings
- Submit reviews for workers
- Update profile

### Worker
- Manage professional profile
- View and accept job requests
- Manage bookings
- Update availability

### Admin
- User management (suspend/unsuspend)
- Worker approval and management
- View all bookings
- Access system statistics

## 🔧 Core Services

### Matching Service
Intelligently matches users with workers based on:
- Service type and skills
- Location proximity
- Worker ratings and availability
- Experience level

### Rating Service
Comprehensive rating system featuring:
- 1-5 star rating scale
- Review comments
- Average rating calculation
- Rating distribution analytics

### Notification Service
Real-time notifications for:
- Booking status updates
- New job requests
- Booking completions
- System announcements

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|worker|admin),
  suspended: Boolean,
  timestamps: true
}
```

### Worker Model
```javascript
{
  userId: ObjectId (ref: User),
  skills: [String],
  location: String,
  rating: Number (0-5),
  totalReviews: Number,
  availability: Boolean,
  experience: Number,
  approved: Boolean,
  timestamps: true
}
```

### Booking Model
```javascript
{
  userId: ObjectId (ref: User),
  workerId: ObjectId (ref: Worker),
  serviceType: String,
  location: String,
  timeSlot: String,
  status: String (pending|accepted|completed|cancelled),
  otp: String,
  timestamps: true
}
```

### Review Model
```javascript
{
  userId: ObjectId (ref: User),
  workerId: ObjectId (ref: Worker),
  bookingId: ObjectId (ref: Booking),
  rating: Number (1-5),
  comment: String,
  timestamps: true
}
```

## 🚦 Error Handling

The API uses consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors (if applicable)
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

The application includes comprehensive error handling and validation. Test the API using:

1. **Postman** - Import the API endpoints and test
2. **cURL** - Command-line testing
3. **Jest** - Unit testing framework (if implemented)

Example cURL request:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"123456","role":"user"}'
```

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Proper authorization for different user types
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Rate Limiting**: Can be implemented for API protection

## 🚀 Deployment

### Environment Variables
Set the following environment variables for production:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start server.js --name "smart-service-api"

# Monitor the application
pm2 monit
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 Development

### Scripts
```json
{
  "start": "node server/server.js",
  "dev": "nodemon server/server.js",
  "test": "jest"
}
```

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous operations
- Consistent error handling
- Clean and modular architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api`

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Booking system with OTP verification
  - Worker matching and rating system
  - Admin panel and notifications

---

**Built with ❤️ using Node.js, Express, MongoDB, and modern web technologies**
