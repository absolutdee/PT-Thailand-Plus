// middleware/uploadHandler.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// สร้างโฟลเดอร์ถ้ายังไม่มี
const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// กำหนด storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // กำหนดโฟลเดอร์ตามประเภทไฟล์
    if (file.fieldname === 'profileImage' || file.fieldname === 'avatar') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'trainerPhotos') {
      uploadPath += 'trainers/';
    } else if (file.fieldname === 'certificate') {
      uploadPath += 'certificates/';
    } else if (file.fieldname === 'gymPhotos') {
      uploadPath += 'gyms/';
    } else if (file.fieldname === 'eventImage') {
      uploadPath += 'events/';
    } else if (file.fieldname === 'articleImage') {
      uploadPath += 'articles/';
    } else {
      uploadPath += 'others/';
    }

    createFolder(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
                  allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageTypes.test(file.mimetype) ||
                   file.mimetype === 'application/pdf' ||
                   file.mimetype === 'application/msword' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง'));
  }
};

// สร้าง multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware สำหรับ resize รูปภาพ
const resizeImage = async (req, res, next) => {
  if (!req.file && !req.files) return next();

  try {
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) continue;

      const filePath = file.path;
      const fileName = file.filename;
      
      // สร้างชื่อไฟล์สำหรับ thumbnail
      const thumbName = 'thumb-' + fileName;
      const thumbPath = path.join(path.dirname(filePath), thumbName);

      // Resize รูปภาพหลัก
      await sharp(filePath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(filePath + '.tmp');

      // สร้าง thumbnail
      await sharp(filePath)
        .resize(200, 200, {
          fit: 'cover'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);

      // แทนที่ไฟล์เดิม
      fs.unlinkSync(filePath);
      fs.renameSync(filePath + '.tmp', filePath);

      // เพิ่ม thumbnail path
      file.thumbnail = thumbPath;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware สำหรับลบไฟล์เก่า
const deleteOldFile = (fieldName) => {
  return async (req, res, next) => {
    try {
      if (req.file && req.user && req.user[fieldName]) {
        const oldFilePath = req.user[fieldName];
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          
          // ลบ thumbnail ด้วย
          const thumbPath = path.join(
            path.dirname(oldFilePath),
            'thumb-' + path.basename(oldFilePath)
          );
          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
          }
        }
      }
      next();
    } catch (error) {
      console.error('Error deleting old file:', error);
      next();
    }
  };
};

// Helper function สำหรับลบไฟล์
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // ลบ thumbnail ถ้ามี
      const thumbPath = path.join(
        path.dirname(filePath),
        'thumb-' + path.basename(filePath)
      );
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Middleware สำหรับจัดการหลายไฟล์
const handleMultipleFiles = (fieldName, maxCount = 12) => {
  return [
    upload.array(fieldName, maxCount),
    resizeImage
  ];
};

// Export upload configurations
module.exports = {
  // Basic upload methods
  uploadSingle: upload.single.bind(upload),
  uploadMultiple: upload.array.bind(upload),
  uploadFields: upload.fields.bind(upload),
  
  // Helper middlewares
  resizeImage,
  deleteOldFile,
  deleteFile,
  
  // Specific upload configurations
  uploadProfileImage: [
    upload.single('profileImage'),
    resizeImage,
    deleteOldFile('profileImage')
  ],
  
  uploadTrainerPhotos: handleMultipleFiles('trainerPhotos', 12),
  
  uploadCertificate: upload.single('certificate'),
  
  uploadEventImage: [
    upload.single('eventImage'),
    resizeImage
  ],
  
  uploadArticleImage: [
    upload.single('articleImage'),
    resizeImage
  ],
  
  uploadGymPhotos: handleMultipleFiles('gymPhotos', 10),
  
  // Upload fields for multiple different files
  uploadMixed: upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
    { name: 'gallery', maxCount: 10 }
  ])
};