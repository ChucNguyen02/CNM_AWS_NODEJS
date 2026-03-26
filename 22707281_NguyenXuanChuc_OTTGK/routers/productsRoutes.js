const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);

router.get('/add', productController.renderAddForm);

router.post('/add', productController.upload.single('image'), productController.addProduct);

router.get('/edit/:id', productController.renderEditForm);
router.post('/edit/:id', productController.upload.single('image'), productController.updateProduct);

router.get('/delete/:id', productController.deleteProduct);
router.get('/detail/:id', productController.getProductDetail);
module.exports = router;