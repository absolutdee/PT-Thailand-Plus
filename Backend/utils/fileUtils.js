// utils/fileUtils.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const createReadStream = require('fs').createReadStream;

const fileUtils = {
  // Generate unique filename
  generateUniqueFilename: (originalFilename) => {
    const ext = path.extname(originalFilename);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}${ext}`;
  },

  // Create directory if not exists
  ensureDir: async (dirPath) => {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  },

  // Delete file
  deleteFile: async (filePath) => {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Move file
  moveFile: async (sourcePath, destPath) => {
    try {
      await fs.rename(sourcePath, destPath);
      return true;
    } catch (error) {
      // If rename fails (different filesystem), copy and delete
      try {
        await fs.copyFile(sourcePath, destPath);
        await fs.unlink(sourcePath);
        return true;
      } catch (copyError) {
        console.error('Error moving file:', copyError);
        return false;
      }
    }
  },

  // Get file info
  getFileInfo: async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        extension: path.extname(filePath),
        name: path.basename(filePath),
        path: filePath
      };
    } catch (error) {
      return null;
    }
  },

  // Format file size
  formatFileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Validate file type
  validateFileType: (filename, allowedTypes) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
  },

  // Get MIME type
  getMimeType: (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  },

  // Process image
  processImage: async (inputPath, outputPath, options = {}) => {
    try {
      const {
        width = null,
        height = null,
        quality = 80,
        format = null,
        fit = 'cover',
        watermark = null
      } = options;

      let pipeline = sharp(inputPath);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, { fit });
      }

      // Add watermark if provided
      if (watermark) {
        const watermarkBuffer = await sharp(watermark.path)
          .resize(watermark.width || 100)
          .toBuffer();

        pipeline = pipeline.composite([{
          input: watermarkBuffer,
          gravity: watermark.position || 'southeast'
        }]);
      }

      // Set format and quality
      if (format) {
        pipeline = pipeline.toFormat(format, { quality });
      } else {
        pipeline = pipeline.jpeg({ quality });
      }

      await pipeline.toFile(outputPath);
      return true;
    } catch (error) {
      console.error('Error processing image:', error);
      return false;
    }
  },

  // Create thumbnail
  createThumbnail: async (inputPath, outputPath, size = 300) => {
    return await fileUtils.processImage(inputPath, outputPath, {
      width: size,
      height: size,
      fit: 'cover'
    });
  },

  // Optimize image
  optimizeImage: async (inputPath, outputPath) => {
    try {
      const metadata = await sharp(inputPath).metadata();
      
      // Set max dimensions
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      let width = metadata.width;
      let height = metadata.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      await sharp(inputPath)
        .resize(width, height)
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
      
      return true;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return false;
    }
  },

  // Get image dimensions
  getImageDimensions: async (imagePath) => {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      return null;
    }
  },

  // Generate PDF
  generatePDF: async (outputPath, content, options = {}) => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument(options);
      const stream = require('fs').createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Add content to PDF
      if (content.title) {
        doc.fontSize(20).text(content.title, { align: 'center' });
        doc.moveDown();
      }
      
      if (content.body) {
        doc.fontSize(12).text(content.body);
      }
      
      if (content.table) {
        // Simple table implementation
        const startX = 50;
        let currentY = doc.y;
        
        // Headers
        if (content.table.headers) {
          doc.fontSize(10).font('Helvetica-Bold');
          content.table.headers.forEach((header, i) => {
            doc.text(header, startX + (i * 100), currentY, { width: 90 });
          });
          currentY += 20;
          doc.font('Helvetica');
        }
        
        // Rows
        content.table.rows.forEach(row => {
          row.forEach((cell, i) => {
            doc.text(cell.toString(), startX + (i * 100), currentY, { width: 90 });
          });
          currentY += 20;
        });
      }
      
      doc.end();
      
      stream.on('finish', () => resolve(true));
      stream.on('error', reject);
    });
  },

  // Read CSV file
  readCSV: async (filePath) => {
    return new Promise((resolve, reject) => {
      const results = [];
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  },

  // Write CSV file
  writeCSV: async (filePath, data, headers) => {
    const rows = [];
    
    // Add headers
    if (headers) {
      rows.push(headers.join(','));
    } else if (data.length > 0) {
      rows.push(Object.keys(data[0]).join(','));
    }
    
    // Add data rows
    data.forEach(item => {
      const values = headers 
        ? headers.map(header => JSON.stringify(item[header] || ''))
        : Object.values(item).map(val => JSON.stringify(val));
      rows.push(values.join(','));
    });
    
    await fs.writeFile(filePath, rows.join('\n'));
  },

  // Read Excel file
  readExcel: async (filePath, sheetName = null) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = sheetName 
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0];
    
    const data = [];
    const headers = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell(cell => headers.push(cell.value));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        data.push(rowData);
      }
    });
    
    return data;
  },

  // Write Excel file
  writeExcel: async (filePath, data, sheetName = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data
      data.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 0;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });
    }
    
    await workbook.xlsx.writeFile(filePath);
  },

  // Clean filename
  cleanFilename: (filename) => {
    return filename
      .replace(/[^a-z0-9.\-_]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },

  // Get file hash
  getFileHash: async (filePath, algorithm = 'sha256') => {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash(algorithm);
    hash.update(fileBuffer);
    return hash.digest('hex');
  },

  // Check if file exists
  fileExists: async (filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Zip files
  zipFiles: async (files, outputPath) => {
    const archiver = require('archiver');
    const output = require('fs').createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(archive.pointer()));
      archive.on('error', reject);
      
      archive.pipe(output);
      
      files.forEach(file => {
        if (file.content) {
          archive.append(file.content, { name: file.name });
        } else if (file.path) {
          archive.file(file.path, { name: file.name || path.basename(file.path) });
        }
      });
      
      archive.finalize();
    });
  },

  // Extract file extension
  getExtension: (filename) => {
    return path.extname(filename).toLowerCase().slice(1);
  },

  // Sanitize file path
  sanitizePath: (filePath) => {
    // Remove any path traversal attempts
    return filePath.replace(/\.\./g, '').replace(/\/\//g, '/');
  },

  // Convert file to base64
  fileToBase64: async (filePath) => {
    const fileBuffer = await fs.readFile(filePath);
    return fileBuffer.toString('base64');
  },

  // Save base64 to file
  base64ToFile: async (base64String, outputPath) => {
    const buffer = Buffer.from(base64String, 'base64');
    await fs.writeFile(outputPath, buffer);
  },

  // Get directory size
  getDirectorySize: async (dirPath) => {
    let totalSize = 0;
    
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        totalSize += await fileUtils.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  },

  // Clean old files
  cleanOldFiles: async (dirPath, daysOld) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const files = await fs.readdir(dirPath);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
};

module.exports = fileUtils;
