const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');

const app = express();

// Cấu hình view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cấu hình file upload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'uploads')
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', productRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send('Trang không tồn tại!');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra!');
});

module.exports = app;