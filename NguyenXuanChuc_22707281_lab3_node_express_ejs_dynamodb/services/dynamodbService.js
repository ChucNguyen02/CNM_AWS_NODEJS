// services/dynamodbService.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  ScanCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');
const { awsConfig, DYNAMODB_TABLE_NAME } = require('../config/awsConfig');

// Tạo DynamoDB client
const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

// Lấy tất cả sản phẩm
async function getAllProducts() {
  try {
    const command = new ScanCommand({
      TableName: DYNAMODB_TABLE_NAME
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
}

// Lấy sản phẩm theo ID
async function getProductById(productId) {
  try {
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        id: productId
      }
    });
    
    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
}

// Tạo sản phẩm mới
async function createProduct(product) {
  try {
    const command = new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: product
    });
    
    await docClient.send(command);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Cập nhật sản phẩm
async function updateProduct(productId, updates) {
  try {
    // Tạo UpdateExpression động
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach((key, index) => {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = updates[key];
    });
    
    const command = new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        id: productId
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Xóa sản phẩm
async function deleteProduct(productId) {
  try {
    const command = new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        id: productId
      }
    });
    
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};