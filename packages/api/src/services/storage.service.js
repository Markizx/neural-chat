const { S3 } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
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
        url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
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
  async deleteFile(key) {
    try {
      // Handle both full URLs and keys
      let fileKey = key;
      if (key.startsWith('http')) {
        const url = new URL(key);
        fileKey = url.pathname.substring(1); // Remove leading slash
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      await this.s3.send(command);
      logger.info(`File deleted: ${fileKey}`);
    } catch (error) {
      logger.error('File deletion failed:', error);
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
}

module.exports = new StorageService();