// controllers/fileUploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { validateFile, scanFile } = require('../utils/fileValidation');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

class FileUploadController {
  // Configure multer
  constructor() {
    this.storage = multer.memoryStorage();
    
    this.fileFilter = (req, file, cb) => {
      const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
      };

      const fileType = this.getFileType(file.mimetype);
      if (fileType && allowedTypes[fileType].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('ประเภทไฟล์ไม่ได้รับอนุญาต'), false);
      }
    };

    this.limits = {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 20 * 1024 * 1024 // 20MB
    };
  }

  // Get file type from mimetype
  getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('msword')) return 'document';
    return null;
  }

  // Upload single file
  async uploadSingleFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกไฟล์'
        });
      }

      const { purpose, folder = 'general' } = req.body;
      const file = req.file;
      const fileType = this.getFileType(file.mimetype);

      // Validate file
      const validation = await validateFile(file, {
        maxSize: this.limits[fileType],
        allowedTypes: [file.mimetype]
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Scan file for viruses (if implemented)
      const scanResult = await scanFile(file.buffer);
      if (!scanResult.isSafe) {
        return res.status(400).json({
          success: false,
          message: 'ไฟล์ไม่ปลอดภัย'
        });
      }

      // Upload to Cloudinary
      const uploadOptions = {
        folder: `${folder}/${fileType}s`,
        resource_type: fileType === 'image' ? 'image' : 'auto'
      };

      // Add transformations for images
      if (fileType === 'image') {
        uploadOptions.transformation = this.getImageTransformation(purpose);
      }

      const result = await uploadToCloudinary(file.buffer, uploadOptions);

      // Save file info to database
      const fileInfo = {
        userId: req.user.userId,
        url: result.secure_url,
        publicId: result.public_id,
        type: fileType,
        purpose,
        size: file.size,
        originalName: file.originalname,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      };

      res.json({
        success: true,
        message: 'อัพโหลดไฟล์สำเร็จ',
        data: fileInfo
      });

    } catch (error) {
      console.error('Upload single file error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์'
      });
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกไฟล์'
        });
      }

      const { purpose, folder = 'general' } = req.body;
      const maxFiles = 10;

      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`
        });
      }

      const uploadPromises = req.files.map(async (file) => {
        const fileType = this.getFileType(file.mimetype);

        // Validate each file
        const validation = await validateFile(file, {
          maxSize: this.limits[fileType],
          allowedTypes: [file.mimetype]
        });

        if (!validation.isValid) {
          throw new Error(`${file.originalname}: ${validation.error}`);
        }

        // Upload to Cloudinary
        const uploadOptions = {
          folder: `${folder}/${fileType}s`,
          resource_type: fileType === 'image' ? 'image' : 'auto'
        };

        if (fileType === 'image') {
          uploadOptions.transformation = this.getImageTransformation(purpose);
        }

        const result = await uploadToCloudinary(file.buffer, uploadOptions);

        return {
          userId: req.user.userId,
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType,
          purpose,
          size: file.size,
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        };
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      
      const failed = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason.message);

      res.json({
        success: true,
        message: `อัพโหลดสำเร็จ ${successful.length} ไฟล์`,
        data: {
          successful,
          failed
        }
      });

    } catch (error) {
      console.error('Upload multiple files error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์'
      });
    }
  }

  // Upload profile picture
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const userId = req.user.userId;
      const file = req.file;

      // Validate image
      const validation = await validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Get user
      const user = await User.findById(userId);
      
      // Delete old profile picture if exists
      if (user.profilePicture && user.profilePicture.publicId) {
        await deleteFromCloudinary(user.profilePicture.publicId);
      }

      // Upload new picture
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'profile-pictures',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      });

      // Update user profile
      user.profilePicture = {
        url: result.secure_url,
        publicId: result.public_id
      };
      await user.save();

      res.json({
        success: true,
        message: 'อัพโหลดรูปโปรไฟล์สำเร็จ',
        data: user.profilePicture
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปโปรไฟล์'
      });
    }
  }

  // Upload trainer certificates
  async uploadCertificates(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกไฟล์'
        });
      }

      const trainerId = req.user.trainerId;
      const maxCertificates = 10;

      const trainer = await Trainer.findById(trainerId);
      
      if (trainer.certifications.length + req.files.length > maxCertificates) {
        return res.status(400).json({
          success: false,
          message: `สามารถอัพโหลดใบรับรองได้สูงสุด ${maxCertificates} ใบ`
        });
      }

      const uploadPromises = req.files.map(async (file) => {
        // Validate file
        const validation = await validateFile(file, {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
        });

        if (!validation.isValid) {
          throw new Error(`${file.originalname}: ${validation.error}`);
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'certificates',
          resource_type: 'auto'
        });

        return {
          name: path.parse(file.originalname).name,
          url: result.secure_url,
          publicId: result.public_id,
          fileType: file.mimetype,
          uploadedAt: new Date()
        };
      });

      const certificates = await Promise.all(uploadPromises);

      // Add to trainer certifications
      trainer.certifications.push(...certificates);
      await trainer.save();

      res.json({
        success: true,
        message: 'อัพโหลดใบรับรองสำเร็จ',
        data: certificates
      });

    } catch (error) {
      console.error('Upload certificates error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดใบรับรอง'
      });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { publicId } = req.params;
      const userId = req.user.userId;

      // Verify file ownership (implement based on your file tracking system)
      // For now, we'll just delete from Cloudinary

      await deleteFromCloudinary(publicId);

      res.json({
        success: true,
        message: 'ลบไฟล์สำเร็จ'
      });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบไฟล์'
      });
    }
  }

  // Get image transformation based on purpose
  getImageTransformation(purpose) {
    const transformations = {
      profile: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ],
      gallery: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto:good' }
      ],
      thumbnail: [
        { width: 200, height: 200, crop: 'thumb' },
        { quality: 'auto' }
      ],
      article: [
        { width: 1200, height: 630, crop: 'fill' },
        { quality: 'auto:good' }
      ],
      progress: [
        { width: 800, height: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    };

    return transformations[purpose] || [{ quality: 'auto' }];
  }

  // Process document (OCR, text extraction)
  async processDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกเอกสาร'
        });
      }

      const file = req.file;

      // Validate document
      const validation = await validateFile(file, {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Process document based on type
      let extractedText = '';
      
      if (file.mimetype === 'application/pdf') {
        // Extract text from PDF (use pdf-parse or similar)
        // extractedText = await extractPDFText(file.buffer);
      } else if (file.mimetype.startsWith('image/')) {
        // OCR for images (use tesseract.js or cloud OCR service)
        // extractedText = await performOCR(file.buffer);
      }

      res.json({
        success: true,
        data: {
          originalName: file.originalname,
          extractedText,
          wordCount: extractedText.split(/\s+/).length
        }
      });

    } catch (error) {
      console.error('Process document error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการประมวลผลเอกสาร'
      });
    }
  }

  // Resize image
  async resizeImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const { width, height, crop = 'fill' } = req.body;
      const file = req.file;

      // Validate image
      const validation = await validateFile(file, {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Upload with transformation
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'resized',
        transformation: [
          { 
            width: parseInt(width) || 800, 
            height: parseInt(height) || 600, 
            crop 
          },
          { quality: 'auto' }
        ]
      });

      res.json({
        success: true,
        message: 'ปรับขนาดรูปภาพสำเร็จ',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height
        }
      });

    } catch (error) {
      console.error('Resize image error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการปรับขนาดรูปภาพ'
      });
    }
  }

  // Generate image variations
  async generateImageVariations(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const file = req.file;
      const variations = [
        { name: 'thumbnail', width: 150, height: 150, crop: 'thumb' },
        { name: 'small', width: 400, height: 300, crop: 'fill' },
        { name: 'medium', width: 800, height: 600, crop: 'fill' },
        { name: 'large', width: 1200, height: 900, crop: 'fill' }
      ];

      const uploadPromises = variations.map(async (variant) => {
        const result = await uploadToCloudinary(file.buffer, {
          folder: `variations/${variant.name}`,
          transformation: [
            { width: variant.width, height: variant.height, crop: variant.crop },
            { quality: 'auto' }
          ]
        });

        return {
          name: variant.name,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height
        };
      });

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        message: 'สร้างรูปภาพหลายขนาดสำเร็จ',
        data: results
      });

    } catch (error) {
      console.error('Generate image variations error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรูปภาพหลายขนาด'
      });
    }
  }

  // Get upload presigned URL (for direct upload to cloud storage)
  async getUploadUrl(req, res) {
    try {
      const { fileType, fileName } = req.query;
      const userId = req.user.userId;

      if (!fileType || !fileName) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุประเภทและชื่อไฟล์'
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(fileName);
      const uniqueFileName = `${userId}_${timestamp}${extension}`;

      // Generate presigned URL (this is a placeholder - implement based on your cloud provider)
      const uploadUrl = `https://your-cloud-storage.com/upload/${uniqueFileName}`;
      const uploadId = `upload_${timestamp}`;

      res.json({
        success: true,
        data: {
          uploadUrl,
          uploadId,
          fileName: uniqueFileName,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      console.error('Get upload URL error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้าง URL อัพโหลด'
      });
    }
  }

  // Confirm upload completion
  async confirmUpload(req, res) {
    try {
      const { uploadId, fileUrl, fileSize } = req.body;
      const userId = req.user.userId;

      // Verify and save file info to database
      const fileInfo = {
        userId,
        uploadId,
        url: fileUrl,
        size: fileSize,
        uploadedAt: new Date(),
        status: 'completed'
      };

      res.json({
        success: true,
        message: 'ยืนยันการอัพโหลดสำเร็จ',
        data: fileInfo
      });

    } catch (error) {
      console.error('Confirm upload error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยืนยันการอัพโหลด'
      });
    }
  }

  // Get user's uploaded files
  async getUserFiles(req, res) {
    try {
      const userId = req.user.userId;
      const { type, page = 1, limit = 20 } = req.query;

      // This would query from your file tracking collection
      // For now, returning sample data
      const files = [
        {
          id: '1',
          url: 'https://example.com/file1.jpg',
          type: 'image',
          originalName: 'profile.jpg',
          size: 1024000,
          uploadedAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: files.length,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get user files error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์'
      });
    }
  }
}

module.exports = new FileUploadController();
