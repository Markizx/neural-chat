const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    
    this.bucket = process.env.AWS_S3_BUCKET;
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
      
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId.toString()
        }
      };

      const result = await this.s3.upload(params).promise();
      
      return {
        key,
        url: result.Location,
        bucket: result.Bucket
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
      
      const params = {
        Bucket: this.bucket,
        Key: key,
        ContentType: fileType,
        Expires: 3600, // 1 hour
        Metadata: {
          originalName: fileName,
          uploadedBy: userId.toString()
        }
      };

      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
      
      return {
        uploadUrl,
        key,
        publicUrl: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      };
    } catch (error) {
      logger.error('Pre-signed URL generation failed:', error);
      throw error;
    }
  }

  // Get file URL
  async getFileUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      logger.error('File URL generation failed:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(key) {
    try {
      // Handle both full URLs and keys
      let fileKey = key;
      if (key.startsWith('http')) {
        const url = new URL(key);
        fileKey = url.pathname.substring(1); // Remove leading slash
      }

      const params = {
        Bucket: this.bucket,
        Key: fileKey
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted: ${fileKey}`);
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw error;
    }
  }

  // Delete multiple files
  async deleteFiles(keys) {
    try {
      const objects = keys.map(key => {
        let fileKey = key;
        if (key.startsWith('http')) {
          const url = new URL(key);
          fileKey = url.pathname.substring(1);
        }
        return { Key: fileKey };
      });

      const params = {
        Bucket: this.bucket,
        Delete: {
          Objects: objects,
          Quiet: true
        }
      };

      await this.s3.deleteObjects(params).promise();
      logger.info(`${keys.length} files deleted`);
    } catch (error) {
      logger.error('Batch file deletion failed:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const metadata = await this.s3.headObject(params).promise();
      return metadata;
    } catch (error) {
      logger.error('File metadata retrieval failed:', error);
      throw error;
    }
  }

  // Copy file
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await this.s3.copyObject(params).promise();
      return result;
    } catch (error) {
      logger.error('File copy failed:', error);
      throw error;
    }
  }

  // List files
  async listFiles(prefix, maxKeys = 100) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      logger.error('File listing failed:', error);
      throw error;
    }
  }

  // Get file as stream
  async getFileStream(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      return this.s3.getObject(params).createReadStream();
    } catch (error) {
      logger.error('File stream retrieval failed:', error);
      throw error;
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
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
        const params = {
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        };

        const result = await this.s3.listObjectsV2(params).promise();
        
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
}

module.exports = new StorageService();