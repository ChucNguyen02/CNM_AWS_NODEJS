const { docClient } = require('../models/db');
const { ScanCommand, PutCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

const getProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword; // Lấy từ khóa từ ô tìm kiếm

        let params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        // Nếu người dùng có nhập từ khóa tìm kiếm
        if (keyword) {
            params.FilterExpression = "contains(#n, :k)";
            params.ExpressionAttributeNames = {
                "#n": "name" // Cột cần tìm là cột 'name'
            };
            params.ExpressionAttributeValues = {
                ":k": keyword // Từ khóa tìm kiếm
            };
        }

        const data = await docClient.send(new ScanCommand(params));


        res.render('index', {
            products: data.Items || [],
            cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN,
            keyword: keyword || ''
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).send("Lỗi server");
    }
};

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const renderAddForm = (req, res) => {
    res.render('add');
};

const addProduct = async (req, res) => {
    try {
        const { id, name, price, unit_in_stock } = req.body;
        let url_image = '';
        if (req.file) {

            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };


            await s3Client.send(new PutObjectCommand(uploadParams));


            url_image = fileName;
        }

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: {
                id: id,
                name: name,
                price: Number(price),
                unit_in_stock: Number(unit_in_stock),
                url_image: url_image
            }
        };

        await docClient.send(new PutCommand(params));


        res.redirect('/');
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).send("Đã xảy ra lỗi khi thêm sản phẩm.");
    }
};

const renderEditForm = async (req, res) => {
    try {
        const productId = req.params.id;
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { id: productId }
        };

        const data = await docClient.send(new GetCommand(params));

        if (!data.Item) {
            return res.status(404).send("Không tìm thấy sản phẩm.");
        }

        res.render('edit', {
            product: data.Item,
            cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN
        });
    } catch (error) {
        console.error("Lỗi khi tải form sửa:", error);
        res.status(500).send("Lỗi server.");
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, price, unit_in_stock, old_image } = req.body;

        // Mặc định giữ lại tên ảnh cũ nếu người dùng không upload ảnh mới
        let url_image = old_image;

        // Nếu người dùng CÓ chọn upload ảnh mới
        if (req.file) {
            // 1. Upload ảnh mới lên S3
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };
            await s3Client.send(new PutObjectCommand(uploadParams));

            // Cập nhật biến url_image thành tên ảnh mới
            url_image = fileName;

            // 2. (Điểm cộng) Xóa ảnh cũ trên S3 để giải phóng dung lượng
            if (old_image) {
                const deleteParams = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: old_image
                };
                await s3Client.send(new DeleteObjectCommand(deleteParams));
            }
        }

        // Cập nhật toàn bộ thông tin mới vào DynamoDB
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: {
                id: productId, // ID không đổi
                name: name,
                price: Number(price),
                unit_in_stock: Number(unit_in_stock),
                url_image: url_image // Ảnh cũ hoặc ảnh mới tùy luồng xử lý ở trên
            }
        };

        await docClient.send(new PutCommand(params));

        // Cập nhật thành công quay về trang chủ
        res.redirect('/');
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        res.status(500).send("Đã xảy ra lỗi khi cập nhật.");
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // 1. Lấy thông tin sản phẩm trước để biết tên file ảnh cần xóa
        const getParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { id: productId }
        };
        const data = await docClient.send(new GetCommand(getParams));

        // 2. (Điểm cộng) Nếu sản phẩm có ảnh, tiến hành xóa ảnh trên S3 
        if (data.Item && data.Item.url_image) {
            const deleteS3Params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: data.Item.url_image
            };
            await s3Client.send(new DeleteObjectCommand(deleteS3Params));
        }

        // 3. Xóa bản ghi sản phẩm khỏi DynamoDB [cite: 6]
        const deleteParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { id: productId }
        };
        await docClient.send(new DeleteCommand(deleteParams));

        // Xóa thành công, tự động load lại trang chủ
        res.redirect('/');
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        res.status(500).send("Đã xảy ra lỗi khi xóa sản phẩm.");
    }
};

const getProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { id: productId }
        };

        // Lấy dữ liệu 1 sản phẩm từ DynamoDB
        const data = await docClient.send(new GetCommand(params));

        if (!data.Item) {
            return res.status(404).send("Không tìm thấy sản phẩm.");
        }

        // Render ra file detail.ejs
        res.render('detail', {
            product: data.Item,
            cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN
        });
    } catch (error) {
        console.error("Lỗi khi xem chi tiết sản phẩm:", error);
        res.status(500).send("Lỗi server.");
    }
};

module.exports = { getProducts, renderAddForm, addProduct, upload, renderEditForm, updateProduct, deleteProduct, getProductDetail };