const express = require("express"); // Import thư viện express
const router = express.Router(); // Khởi tạo một router từ express
const subjectController = require("../controllers/index"); // Import controller từ file controller/index.js

router.get("/", subjectController.get); // API endpoint lấy tất cả các subject
router.get("/:id", subjectController.getOne); // API endpoint lấy thông tin của subject dựa vào id

module.exports = router;
