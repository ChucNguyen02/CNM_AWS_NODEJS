const app = require('./app');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Môi trường: ${process.env.NODE_ENV || 'development'}`);
});