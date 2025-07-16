// imageUtils.js - Utility functions for image handling

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

class ImageUtils {
    constructor() {
        this.allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.thumbnailSizes = {
            small: { width: 150, height: 150 },
            medium: { width: 400, height: 400 },
            large: { width: 800, height: 800 },
        };
        this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    }

    // Validate image file
    validateImage(file) {
        const errors = [];

        // Check file existence
        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
        }

        // Check file format
        const ext = this.getFileExtension(file.originalname || file.name);
        if (!this.allowedFormats.includes(ext.toLowerCase())) {
            errors.push(`Invalid file format. Allowed formats: ${this.allowedFormats.join(', ')}`);
        }

        // Check MIME type
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            errors.push('File is not an image');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    // Get file extension
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Generate unique filename
    generateUniqueFilename(originalName) {
        const ext = this.getFileExtension(originalName);
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        return `${timestamp}_${randomString}.${ext}`;
    }

    // Process and save image
    async processAndSaveImage(file, options = {}) {
        try {
            const validation = this.validateImage(file);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            const filename = this.generateUniqueFilename(file.originalname || file.name);
            const filepath = path.join(this.uploadPath, options.folder || '', filename);

            // Ensure directory exists
            await this.ensureDirectoryExists(path.dirname(filepath));

            // Process image with sharp
            const image = sharp(file.buffer || file.path);
            const metadata = await image.metadata();

            // Apply transformations
            let processedImage = image;

            // Resize if dimensions exceed limits
            if (options.maxWidth || options.maxHeight) {
                processedImage = processedImage.resize({
                    width: options.maxWidth,
                    height: options.maxHeight,
                    fit: options.fit || 'inside',
                    withoutEnlargement: true,
                });
            }

            // Auto-orient based on EXIF data
            processedImage = processedImage.rotate();

            // Convert format if specified
            if (options.format) {
                processedImage = processedImage.toFormat(options.format, {
                    quality: options.quality || 85,
                });
            }

            // Apply compression
            if (options.compress !== false) {
                processedImage = this.applyCompression(processedImage, metadata.format, options.quality);
            }

            // Save the processed image
            await processedImage.toFile(filepath);

            // Generate thumbnails if requested
            let thumbnails = {};
            if (options.generateThumbnails) {
                thumbnails = await this.generateThumbnails(filepath, filename, options.thumbnailSizes);
            }

            // Get final image info
            const finalMetadata = await sharp(filepath).metadata();

            return {
                filename,
                filepath,
                url: this.getImageUrl(filename, options.folder),
                size: finalMetadata.size,
                width: finalMetadata.width,
                height: finalMetadata.height,
                format: finalMetadata.format,
                thumbnails,
            };
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    }

    // Apply compression based on format
    applyCompression(image, format, quality = 85) {
        switch (format) {
            case 'jpeg':
            case 'jpg':
                return image.jpeg({ quality, progressive: true });
            case 'png':
                return image.png({ compressionLevel: 8 });
            case 'webp':
                return image.webp({ quality });
            default:
                return image;
        }
    }

    // Generate thumbnails
    async generateThumbnails(originalPath, originalFilename, customSizes) {
        const sizes = customSizes || this.thumbnailSizes;
        const thumbnails = {};

        for (const [sizeName, dimensions] of Object.entries(sizes)) {
            const thumbFilename = this.getThumbFilename(originalFilename, sizeName);
            const thumbPath = path.join(
                this.uploadPath,
                'thumbnails',
                sizeName,
                thumbFilename
            );

            await this.ensureDirectoryExists(path.dirname(thumbPath));

            await sharp(originalPath)
                .resize(dimensions.width, dimensions.height, {
                    fit: 'cover',
                    position: 'center',
                })
                .toFile(thumbPath);

            thumbnails[sizeName] = {
                filename: thumbFilename,
                url: this.getImageUrl(thumbFilename, `thumbnails/${sizeName}`),
                width: dimensions.width,
                height: dimensions.height,
            };
        }

        return thumbnails;
    }

    // Get thumbnail filename
    getThumbFilename(originalFilename, sizeName) {
        const ext = this.getFileExtension(originalFilename);
        const nameWithoutExt = originalFilename.slice(0, -(ext.length + 1));
        return `${nameWithoutExt}_${sizeName}.${ext}`;
    }

    // Crop image
    async cropImage(imagePath, cropData) {
        const { x, y, width, height } = cropData;
        const outputPath = imagePath.replace(/\.([^.]+)$/, '_cropped.$1');

        await sharp(imagePath)
            .extract({
                left: Math.round(x),
                top: Math.round(y),
                width: Math.round(width),
                height: Math.round(height),
            })
            .toFile(outputPath);

        return outputPath;
    }

    // Resize image
    async resizeImage(imagePath, width, height, options = {}) {
        const outputPath = imagePath.replace(/\.([^.]+)$/, `_${width}x${height}.$1`);

        await sharp(imagePath)
            .resize(width, height, {
                fit: options.fit || 'cover',
                position: options.position || 'center',
                background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .toFile(outputPath);

        return outputPath;
    }

    // Apply watermark
    async applyWatermark(imagePath, watermarkPath, options = {}) {
        const outputPath = imagePath.replace(/\.([^.]+)$/, '_watermarked.$1');
        const position = options.position || 'southeast';
        const opacity = options.opacity || 0.5;

        const image = await sharp(imagePath).metadata();
        const watermark = await sharp(watermarkPath)
            .resize({
                width: Math.round(image.width * (options.scale || 0.2)),
                fit: 'inside',
            })
            .composite([{
                input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
                raw: {
                    width: 1,
                    height: 1,
                    channels: 4,
                },
                tile: true,
                blend: 'dest-in',
            }])
            .toBuffer();

        await sharp(imagePath)
            .composite([{
                input: watermark,
                gravity: position,
            }])
            .toFile(outputPath);

        return outputPath;
    }

    // Convert image format
    async convertFormat(imagePath, targetFormat, options = {}) {
        const outputPath = imagePath.replace(/\.[^.]+$/, `.${targetFormat}`);

        await sharp(imagePath)
            .toFormat(targetFormat, {
                quality: options.quality || 85,
                progressive: options.progressive !== false,
            })
            .toFile(outputPath);

        return outputPath;
    }

    // Get image metadata
    async getImageMetadata(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = await fs.stat(imagePath);

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation,
                colorSpace: metadata.space,
                created: stats.birthtime,
                modified: stats.mtime,
            };
        } catch (error) {
            console.error('Error getting image metadata:', error);
            throw error;
        }
    }

    // Delete image and its thumbnails
    async deleteImage(filename, folder = '') {
        try {
            // Delete main image
            const mainPath = path.join(this.uploadPath, folder, filename);
            await fs.unlink(mainPath).catch(() => {});

            // Delete thumbnails
            for (const sizeName of Object.keys(this.thumbnailSizes)) {
                const thumbFilename = this.getThumbFilename(filename, sizeName);
                const thumbPath = path.join(
                    this.uploadPath,
                    'thumbnails',
                    sizeName,
                    thumbFilename
                );
                await fs.unlink(thumbPath).catch(() => {});
            }

            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }

    // Optimize image for web
    async optimizeForWeb(imagePath, options = {}) {
        const outputPath = imagePath.replace(/\.([^.]+)$/, '_optimized.$1');
        const metadata = await sharp(imagePath).metadata();

        let pipeline = sharp(imagePath);

        // Resize if too large
        const maxDimension = options.maxDimension || 2000;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            pipeline = pipeline.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Convert to efficient format
        const targetFormat = options.format || 'webp';
        pipeline = pipeline.toFormat(targetFormat, {
            quality: options.quality || 80,
        });

        // Remove metadata
        if (options.removeMetadata !== false) {
            pipeline = pipeline.withMetadata({
                orientation: metadata.orientation,
            });
        }

        await pipeline.toFile(outputPath);
        return outputPath;
    }

    // Create image placeholder
    async createPlaceholder(width, height, options = {}) {
        const color = options.color || '#cccccc';
        const text = options.text || `${width}x${height}`;
        const filename = `placeholder_${width}x${height}_${Date.now()}.png`;
        const filepath = path.join(this.uploadPath, 'placeholders', filename);

        await this.ensureDirectoryExists(path.dirname(filepath));

        const svg = `
            <svg width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="${color}"/>
                <text x="50%" y="50%" font-family="Arial" font-size="${Math.min(width, height) * 0.1}" 
                      fill="#666666" text-anchor="middle" dy=".3em">${text}</text>
            </svg>
        `;

        await sharp(Buffer.from(svg))
            .png()
            .toFile(filepath);

        return {
            filename,
            url: this.getImageUrl(filename, 'placeholders'),
        };
    }

    // Ensure directory exists
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    // Get image URL
    getImageUrl(filename, folder = '') {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const uploadUrl = process.env.UPLOAD_URL || '/uploads';
        return `${baseUrl}${uploadUrl}${folder ? '/' + folder : ''}/${filename}`;
    }

    // Client-side image preview
    static createImagePreview(file, callback) {
        if (!file || !file.type.startsWith('image/')) {
            callback(new Error('Invalid file type'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                callback(null, {
                    url: e.target.result,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    name: file.name,
                });
            };
            img.onerror = () => callback(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => callback(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    }

    // Client-side image compression
    static async compressImageClient(file, options = {}) {
        const maxWidth = options.maxWidth || 1920;
        const maxHeight = options.maxHeight || 1080;
        const quality = options.quality || 0.8;
        const outputType = options.outputType || file.type;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Calculate new dimensions
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(new File([blob], file.name, { type: outputType }));
                            } else {
                                reject(new Error('Canvas to Blob conversion failed'));
                            }
                        },
                        outputType,
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
}

// Export singleton instance
const imageUtils = new ImageUtils();
export default imageUtils;

// Export class for client-side usage
export { ImageUtils };
