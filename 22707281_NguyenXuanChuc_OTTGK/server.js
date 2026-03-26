require('dotenv').config();
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

const productRoutes = require('./routers/productsRoutes');

app.use('/', productRoutes);

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`server ddang chay tai port: ${port}`);
});