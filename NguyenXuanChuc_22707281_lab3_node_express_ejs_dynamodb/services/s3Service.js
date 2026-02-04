const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { awsConfig, S3_BUCKET_NAME } = require('../config/awsConfig');
const fs = require('fs');
const path = require('path');

// Tạo S3 client
const s3Client = new S3Client(awsConfig);

// Upload file lên S3
async function uploadFileToS3(file, fileName) {
  try {
    const fileContent = fs.readFileSync(file.tempFilePath);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype,
      ACL: 'public-read' // Có thể truy cập công khai
    });
    
    await s3Client.send(command);
    
    // Xóa file tạm
    fs.unlinkSync(file.tempFilePath);
    
    // Trả về URL của file
    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com/${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

// Xóa file từ S3
async function deleteFileFromS3(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

// Lấy URL có chữ ký (signed URL) cho file private
async function getSignedUrlForFile(fileName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
  getSignedUrlForFile
};