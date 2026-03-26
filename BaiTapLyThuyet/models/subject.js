const { dynamodb } = require("../utils/aws-helper"); // Import DynamoDB service đã khởi tạo từ file aws-helper.js
const { v4: uuidv4 } = require("uuid"); // Import thư viện uuid để tạo unique ID cho subject

const tableName = "Subjects"; // Tên của table đã tạo trong DynamoDB

// Dầu tiên, chúng ta sẽ tạo một object SubjectModel chứa các method đọc,thêm, sửa,xoá để thao tác với DynamoDB
const SubjectModel = {
  createSubject: async subjectData => {
    const subjectId = uuidv4(); // Tạo unique ID cho subject
    const params = {
      TableName: tableName,
      Item: {
        id: subjectId,
        name: subjectData.name,
        type: subjectData.type,
        semester: subjectData.semester,
        faculty: subjectData.faculty,
        image: subjectData.image,
      },
    };
    try {
      await dynamodb.put(params).promise();
      return { id: subjectId, ...subjectData };
    } catch (error) {
      console.error("Error creating subject:", error);
      throw error;
    }
  },

  getSubjects: async () => {
    const params = {
      TableName: tableName,
    };
    try {
      const subjects = await dynamodb.scan(params).promise();
      return subjects.Items;
    } catch (error) {
      console.error("Error getting subjects:", error);
      throw error;
    }
  },

  updateSubject: async (subjectId, subjectData) => {
    const params = {
      TableName: tableName,
      Key: {
        id: subjectId,
        name: subjectData.name,
      },
      UpdateExpression: "set #t = :type, #s = :semester, #f = :faculty, #i = :image",
      ExpressionAttributeNames: {
        "#t": "type",
        "#s": "semester",
        "#f": "faculty",
        "#i": "image",
      },
      ExpressionAttributeValues: {
        ":type": subjectData.type,
        ":semester": subjectData.semester,
        ":faculty": subjectData.faculty,
        ":image": subjectData.image,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const updatedSubject = await dynamodb.update(params).promise();
      return updatedSubject.Attributes;
    } catch (error) {
      console.error("Error updating subject:", error);
      throw error;
    }
  },

  deleteSubject: async (subjectId, name) => {
    const params = {
      TableName: tableName,
      Key: {
        id: subjectId,
        name: name,
      },
    };
    try {
      await dynamodb.delete(params).promise();
      return { id: subjectId };
    } catch (error) {
      console.error("Error deleting subject:", error);
      throw error;
    }
  },

  getOneSubject: async subjectId => {
    const params = {
      TableName: tableName,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": subjectId,
      },
    };
    try {
      const data = await dynamodb.query(params).promise();
      return data.Items[0];
    } catch (error) {
      console.error("Error getting one subject:", error);
      throw error;
    }
  },
};

module.exports = SubjectModel;