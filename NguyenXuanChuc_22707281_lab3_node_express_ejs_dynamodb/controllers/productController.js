const { v4: uuidv4 } = require('uuid');
const dynamodbService = require('../services/dynamodbService');
const s3Service = require('../services/s3Service');
const path = require('path');

// Hiển thị danh sách sản phẩm
exports.listProducts = async (req, res) => {
  try {
    const products = await dynamodbService.getAllProducts();
    res.render('index', { 
      products,
      message: req.query.message || null
    });
  } catch (error) {
    console.error('Error in listProducts:', error);
    res.status(500).send('Lỗi khi tải danh sách sản phẩm');
  }
};

// Hiển thị form thêm sản phẩm
exports.showAddForm = (req, res) => {
  res.render('add-product', { error: null });
};

// Thêm sản phẩm mới
exports.addProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    
    // Validate dữ liệu
    if (!name || !price || !stock) {
      return res.render('add-product', { 
        error: 'Vui lòng điền đầy đủ thông tin!' 
      });
    }
    
    // Kiểm tra file upload
    if (!req.files || !req.files.image) {
      return res.render('add-product', { 
        error: 'Vui lòng chọn hình ảnh sản phẩm!' 
      });
    }
    
    const image = req.files.image;
    
    // Kiểm tra định dạng file
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = path.extname(image.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.render('add-product', { 
        error: 'Chỉ chấp nhận file ảnh: jpg, jpeg, png, gif!' 
      });
    }
    
    // Tạo ID và tên file unique
    const productId = uuidv4();
    const fileName = `products/${productId}${fileExtension}`;
    
    // Upload hình ảnh lên S3
    const imageUrl = await s3Service.uploadFileToS3(image, fileName);
    
    // Tạo object sản phẩm
    const product = {
      id: productId,
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl,
      imageName: fileName,
      createdAt: new Date().toISOString()
    };
    
    // Lưu vào DynamoDB
    await dynamodbService.createProduct(product);
    
    res.redirect('/?message=Thêm sản phẩm thành công!');
  } catch (error) {
    console.error('Error in addProduct:', error);
    res.render('add-product', { 
      error: 'Lỗi khi thêm sản phẩm. Vui lòng thử lại!' 
    });
  }
};

// Hiển thị form sửa sản phẩm
exports.showEditForm = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await dynamodbService.getProductById(productId);
    
    if (!product) {
      return res.redirect('/?message=Không tìm thấy sản phẩm!');
    }
    
    res.render('edit-product', { product, error: null });
  } catch (error) {
    console.error('Error in showEditForm:', error);
    res.redirect('/?message=Lỗi khi tải thông tin sản phẩm!');
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, stock } = req.body;
    
    // Lấy thông tin sản phẩm hiện tại
    const currentProduct = await dynamodbService.getProductById(productId);
    
    if (!currentProduct) {
      return res.redirect('/?message=Không tìm thấy sản phẩm!');
    }
    
    // Chuẩn bị dữ liệu cập nhật
    const updates = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      updatedAt: new Date().toISOString()
    };
    
    // Kiểm tra xem có upload hình mới không
    if (req.files && req.files.image) {
      const image = req.files.image;
      const fileExtension = path.extname(image.name).toLowerCase();
      const fileName = `products/${productId}${fileExtension}`;
      
      // Xóa hình cũ trên S3 (nếu có)
      if (currentProduct.imageName) {
        await s3Service.deleteFileFromS3(currentProduct.imageName);
      }
      
      // Upload hình mới
      const imageUrl = await s3Service.uploadFileToS3(image, fileName);
      updates.imageUrl = imageUrl;
      updates.imageName = fileName;
    }
    
    // Cập nhật trong DynamoDB
    await dynamodbService.updateProduct(productId, updates);
    
    res.redirect('/?message=Cập nhật sản phẩm thành công!');
  } catch (error) {
    console.error('Error in updateProduct:', error);
    const product = await dynamodbService.getProductById(req.params.id);
    res.render('edit-product', { 
      product, 
      error: 'Lỗi khi cập nhật sản phẩm. Vui lòng thử lại!' 
    });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Lấy thông tin sản phẩm
    const product = await dynamodbService.getProductById(productId);
    
    if (!product) {
      return res.redirect('/?message=Không tìm thấy sản phẩm!');
    }
    
    // Xóa hình ảnh trên S3
    if (product.imageName) {
      await s3Service.deleteFileFromS3(product.imageName);
    }
    
    // Xóa sản phẩm trong DynamoDB
    await dynamodbService.deleteProduct(productId);
    
    res.redirect('/?message=Xóa sản phẩm thành công!');
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.redirect('/?message=Lỗi khi xóa sản phẩm!');
  }
};