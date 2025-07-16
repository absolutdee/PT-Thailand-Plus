// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { AppError } = require('./errorHandler');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/trainers',
    'uploads/certificates',
    'uploads/documents',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// File filter functions
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('ไฟล์ต้องเป็นรูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)', 400));
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('ไฟล์ต้องเป็น PDF, DOC, DOCX หรือ TXT เท่านั้น', 400));
  }
};

// Storage configurations
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const trainerImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/trainers');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `trainer-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `cert-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `doc-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer configurations
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadTrainerImages = multer({
  storage: trainerImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 12 // Maximum 12 images
  }
});

const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Image processing middleware
const processImage = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files ? 
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
        [req.file];

      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const outputPath = file.path.replace(/\.(jpeg|jpg|png|gif|webp)$/i, '-processed.jpg');
          
          // Default options
          const defaultOptions = {
            width: 800,
            height: 800,
            fit: 'inside',
            quality: 85
          };
          
          const imageOptions = { ...defaultOptions, ...options };
          
          // Process image
          await sharp(file.path)
            .resize(imageOptions.width, imageOptions.height, {
              fit: imageOptions.fit,
              withoutEnlargement: true
            })
            .jpeg({ quality: imageOptions.quality })
            .toFile(outputPath);
          
          // Delete original file
          fs.unlinkSync(file.path);
          
          // Update file info
          file.path = outputPath;
          file.filename = file.filename.replace(/\.(jpeg|jpg|png|gif|webp)$/i, '-processed.jpg');
          
          return file;
        })
      );

      // Update req object
      if (req.file) {
        req.file = processedFiles[0];
      } else if (req.files) {
        if (Array.isArray(req.files)) {
          req.files = processedFiles;
        } else {
          // Handle fields object
          const fields = Object.keys(req.files);
          fields.forEach((field, index) => {
            req.files[field] = [processedFiles[index]];
          });
        }
      }

      next();
    } catch (error) {
      next(new AppError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 500));
    }
  };
};

// Generate thumbnail middleware
const generateThumbnail = (width = 200, height = 200) => {
  return async (req, res, next) => {
    try {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files ? 
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
        [req.file];

      await Promise.all(
        files.map(async (file) => {
          const thumbnailPath = file.path.replace(/\.(jpeg|jpg|png|gif|webp)$/i, '-thumb.jpg');
          
          await sharp(file.path)
            .resize(width, height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 70 })
            .toFile(thumbnailPath);
          
          // Add thumbnail path to file object
          file.thumbnailPath = thumbnailPath;
          file.thumbnailFilename = file.filename.replace(/\.(jpeg|jpg|png|gif|webp)$/i, '-thumb.jpg');
        })
      );

      next();
    } catch (error) {
      next(new AppError('เกิดข้อผิดพลาดในการสร้าง Thumbnail', 500));
    }
  };
};

// Delete file utility
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Clean up old files middleware
const cleanupOldFiles = (directory, daysOld = 7) => {
  return async (req, res, next) => {
    try {
      const files = fs.readdirSync(directory);
      const now = Date.now();
      const cutoffTime = daysOld * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > cutoffTime) {
          await deleteFile(filePath);
        }
      }

      next();
    } catch (error) {
      // Don't block request if cleanup fails
      console.error('Cleanup error:', error);
      next();
    }
  };
};

// File validation middleware
const validateFileSize = (maxSize) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? 
      (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
      [req.file];

    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      // Delete uploaded files
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });

      return next(new AppError(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSize / 1024 / 1024}MB)`, 400));
    }

    next();
  };
};

// Memory storage for temporary files
const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// S3 upload handler (if using AWS S3)
const uploadToS3 = async (file, folder) => {
  // Implement S3 upload logic here
  // Return S3 URL
};

// Cloudinary upload handler (if using Cloudinary)
const uploadToCloudinary = async (file, folder) => {
  // Implement Cloudinary upload logic here
  // Return Cloudinary URL
};

module.exports = {
  uploadProfileImage,
  uploadTrainerImages,
  uploadCertificate,
  uploadDocument,
  uploadToMemory,
  processImage,
  generateThumbnail,
  deleteFile,
  cleanupOldFiles,
  validateFileSize,
  uploadToS3,
  uploadToCloudinary,
  imageFileFilter,
  documentFileFilter
};