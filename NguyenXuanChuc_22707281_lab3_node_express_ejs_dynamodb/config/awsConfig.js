// config/awsConfig.js
require('dotenv').config();

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Tên bảng DynamoDB
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'Products';

// Tên bucket S3
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'product-images-bucket';

module.exports = {
  awsConfig,
  DYNAMODB_TABLE_NAME,
  S3_BUCKET_NAME
};