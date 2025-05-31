const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class StorageService {
  constructor() {
    this.isS3Available = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY && 
      process.env.AWS_S3_BUCKET
    );
    
    if (this.isS3Available) {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      this.bucket = process.env.AWS_S3_BUCKET;
    }
    
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  // Generate unique file key
  generateFileKey(fileName, userId) {
    const extension = fileName.split('.').pop();
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    return `users/${userId}/${timestamp}-${uniqueId}.${extension}`;
  }

  // Upload file
  async uploadFile(file, userId) {
    try {
      const key = this.generateFileKey(file.originalname, userId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId.toString()
        }
      });

      await this.s3.send(command);
      
      return {
        key,
        url: `https://${this.bucket}.s3.${process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
        bucket: this.bucket
      };
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw error;
    }
  }

  // Get pre-signed upload URL
  async getPresignedUploadUrl(fileName, fileType, userId) {
    try {
      const key = this.generateFileKey(fileName, userId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: fileType,
        Metadata: {
          originalName: fileName,
          uploadedBy: userId.toString()
        }
      });

      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
      
      return {
        uploadUrl,
        key,
        publicUrl: `https://${this.bucket}.s3.${process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
      };
    } catch (error) {
      logger.error('Pre-signed URL generation failed:', error);
      throw error;
    }
  }

  // Get file URL
  async getFileUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('File URL generation failed:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileUrl) {
    try {
      if (this.isS3Available && fileUrl.includes('amazonaws.com')) {
        // S3 file
        const key = this.extractS3Key(fileUrl);
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        });
        await this.s3.send(command);
        logger.info(`🗑️ Deleted S3 file: ${key}`);
      } else {
        // Local file
        const filename = path.basename(fileUrl);
        const filePath = path.join(this.uploadsDir, filename);
        
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          logger.info(`🗑️ Deleted local file: ${filename}`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
          // File doesn't exist, that's ok
        }
      }
    } catch (error) {
      logger.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const metadata = await this.s3.send(command);
      return metadata;
    } catch (error) {
      logger.error('File metadata retrieval failed:', error);
      throw error;
    }
  }

  // List files
  async listFiles(prefix, maxKeys = 100) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      });

      const result = await this.s3.send(command);
      return result.Contents || [];
    } catch (error) {
      logger.error('File listing failed:', error);
      throw error;
    }
  }

  // Copy file
  async copyFile(sourceKey, destinationKey) {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      });

      const result = await this.s3.send(command);
      return result;
    } catch (error) {
      logger.error('File copy failed:', error);
      throw error;
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Calculate folder size
  async calculateFolderSize(prefix) {
    try {
      let totalSize = 0;
      let continuationToken = null;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        });

        const result = await this.s3.send(command);
        
        if (result.Contents) {
          totalSize += result.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
        }

        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      return totalSize;
    } catch (error) {
      logger.error('Folder size calculation failed:', error);
      throw error;
    }
  }

  /**
   * Extract S3 key from URL
   * @param {string} url - S3 URL
   */
  extractS3Key(url) {
    if (url.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('amazonaws.com'));
      return urlParts.slice(bucketIndex + 1).join('/');
    }
    return url;
  }

  /**
   * Get a signed URL for private S3 files
   * @param {string} fileUrl - S3 file URL
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(fileUrl, expiresIn = 3600) {
    if (!this.isS3Available || !fileUrl.includes('amazonaws.com')) {
      // For local files, return the URL as-is
      return fileUrl;
    }

    try {
      const key = this.extractS3Key(fileUrl);
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      const signedUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error('❌ Error generating signed URL:', error);
      return fileUrl; // Fallback to original URL
    }
  }

  /**
   * Get file URL for frontend
   * @param {string} fileUrl - Original file URL/path
   */
  getPublicUrl(fileUrl) {
    if (this.isS3Available && fileUrl.includes('amazonaws.com')) {
      // For S3 files, return signed URL
      return this.getSignedUrl(fileUrl);
    } else {
      // For local files, ensure proper URL format
      if (fileUrl.startsWith('/uploads/')) {
        return `${process.env.API_URL || 'http://localhost:5000'}${fileUrl}`;
      }
      return fileUrl;
    }
  }

  /**
   * Check if storage is using S3
   */
  isUsingS3() {
    return this.isS3Available && process.env.NODE_ENV === 'production';
  }

  /**
   * Get storage info
   */
  getStorageInfo() {
    return {
      type: this.isUsingS3() ? 's3' : 'local',
      bucket: this.bucket,
      uploadsDir: this.uploadsDir,
      isS3Available: this.isS3Available
    };
  }
}

module.exports = new StorageService();