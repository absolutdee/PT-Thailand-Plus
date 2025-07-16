// middleware/roleCheck.js
const { AppError } = require('./errorHandler');

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.userRole !== 'admin') {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Admin Only)', 403));
  }
  next();
};

// Check if user is Trainer
const isTrainer = (req, res, next) => {
  if (!req.user || req.userRole !== 'trainer') {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Trainer Only)', 403));
  }
  next();
};

// Check if user is Customer
const isCustomer = (req, res, next) => {
  if (!req.user || req.userRole !== 'customer') {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Customer Only)', 403));
  }
  next();
};

// Check if user is Trainer or Admin
const isTrainerOrAdmin = (req, res, next) => {
  if (!req.user || !['trainer', 'admin'].includes(req.userRole)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
  }
  next();
};

// Check if user is Customer or Admin
const isCustomerOrAdmin = (req, res, next) => {
  if (!req.user || !['customer', 'admin'].includes(req.userRole)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
  }
  next();
};

// Check if user has any valid role
const hasValidRole = (req, res, next) => {
  if (!req.user || !['customer', 'trainer', 'admin'].includes(req.userRole)) {
    return next(new AppError('Role ไม่ถูกต้อง', 403));
  }
  next();
};

// Check trainer status
const isActiveTrainer = async (req, res, next) => {
  try {
    if (req.userRole !== 'trainer') {
      return next(new AppError('เฉพาะเทรนเนอร์เท่านั้น', 403));
    }

    const trainer = req.user;
    
    // Check if trainer is verified
    if (!trainer.isVerified) {
      return next(new AppError('บัญชีเทรนเนอร์ของคุณยังไม่ได้รับการยืนยัน', 403));
    }

    // Check if trainer profile is complete
    if (!trainer.profileCompleted) {
      return next(new AppError('กรุณากรอกข้อมูลโปรไฟล์ให้ครบถ้วน', 403));
    }

    // Check if trainer is active
    if (!trainer.isActive) {
      return next(new AppError('บัญชีเทรนเนอร์ของคุณถูกระงับ', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check resource ownership
const isResourceOwner = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      // Admin can access all resources
      if (req.userRole === 'admin') {
        return next();
      }

      // Get resource ID from params
      const resourceId = req.params.id || req.body.resourceId;
      
      if (!resourceId) {
        return next(new AppError('ไม่พบ Resource ID', 400));
      }

      // Check ownership based on resource field
      const isOwner = req.resource && 
        req.resource[resourceField] && 
        req.resource[resourceField].toString() === req.userId;

      if (!isOwner) {
        return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can access trainer data
const canAccessTrainerData = (req, res, next) => {
  const trainerId = req.params.trainerId || req.body.trainerId;
  
  // Admin can access all
  if (req.userRole === 'admin') {
    return next();
  }
  
  // Trainer can access own data
  if (req.userRole === 'trainer' && req.userId === trainerId) {
    return next();
  }
  
  // Customer can access trainer's public data (handled by controller)
  if (req.userRole === 'customer') {
    req.publicDataOnly = true;
    return next();
  }
  
  return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
};

// Check if user can access customer data
const canAccessCustomerData = (req, res, next) => {
  const customerId = req.params.customerId || req.body.customerId;
  
  // Admin can access all
  if (req.userRole === 'admin') {
    return next();
  }
  
  // Customer can access own data
  if (req.userRole === 'customer' && req.userId === customerId) {
    return next();
  }
  
  // Trainer can access customer data if they have active booking
  if (req.userRole === 'trainer') {
    req.checkBookingRelation = true;
    return next();
  }
  
  return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
};

// Check package ownership
const isPackageOwner = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      return next();
    }

    if (req.userRole !== 'trainer') {
      return next(new AppError('เฉพาะเทรนเนอร์เท่านั้นที่สามารถจัดการแพคเกจได้', 403));
    }

    const Package = require('../models/Package');
    const packageId = req.params.id || req.body.packageId;
    
    const package = await Package.findById(packageId);
    
    if (!package) {
      return next(new AppError('ไม่พบแพคเกจ', 404));
    }

    if (package.trainerId.toString() !== req.userId) {
      return next(new AppError('คุณไม่มีสิทธิ์จัดการแพคเกจนี้', 403));
    }

    req.package = package;
    next();
  } catch (error) {
    next(error);
  }
};

// Check booking access
const canAccessBooking = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      return next();
    }

    const Booking = require('../models/Booking');
    const bookingId = req.params.id || req.body.bookingId;
    
    const booking = await Booking.findById(bookingId)
      .populate('packageId');
    
    if (!booking) {
      return next(new AppError('ไม่พบการจอง', 404));
    }

    const isCustomer = req.userRole === 'customer' && 
      booking.userId.toString() === req.userId;
    
    const isTrainer = req.userRole === 'trainer' && 
      booking.packageId.trainerId.toString() === req.userId;

    if (!isCustomer && !isTrainer) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงการจองนี้', 403));
    }

    req.booking = booking;
    next();
  } catch (error) {
    next(error);
  }
};

// Check session access
const canAccessSession = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      return next();
    }

    const Session = require('../models/Session');
    const sessionId = req.params.id || req.body.sessionId;
    
    const session = await Session.findById(sessionId)
      .populate('bookingId');
    
    if (!session) {
      return next(new AppError('ไม่พบเซสชั่น', 404));
    }

    const isCustomer = req.userRole === 'customer' && 
      session.bookingId.userId.toString() === req.userId;
    
    const isTrainer = req.userRole === 'trainer' && 
      session.trainerId.toString() === req.userId;

    if (!isCustomer && !isTrainer) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงเซสชั่นนี้', 403));
    }

    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

// Check review permissions
const canManageReview = async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const reviewId = req.params.id;
    
    if (!reviewId) {
      // Creating new review - only customers can create
      if (req.userRole !== 'customer') {
        return next(new AppError('เฉพาะลูกค้าเท่านั้นที่สามารถเขียนรีวิวได้', 403));
      }
      return next();
    }

    // Editing/Deleting review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return next(new AppError('ไม่พบรีวิว', 404));
    }

    // Admin can manage all reviews
    if (req.userRole === 'admin') {
      req.review = review;
      return next();
    }

    // Only review owner can edit/delete
    if (review.userId.toString() !== req.userId) {
      return next(new AppError('คุณไม่มีสิทธิ์จัดการรีวิวนี้', 403));
    }

    req.review = review;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAdmin,
  isTrainer,
  isCustomer,
  isTrainerOrAdmin,
  isCustomerOrAdmin,
  hasValidRole,
  isActiveTrainer,
  isResourceOwner,
  canAccessTrainerData,
  canAccessCustomerData,
  isPackageOwner,
  canAccessBooking,
  canAccessSession,
  canManageReview
};