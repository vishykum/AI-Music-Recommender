const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { cmdLogger, persistentLogger } = require('./logger');

const usersRoutes = require('./api/userRoutes');

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use('/users', usersRoutes);

app.listen(3000, () => {
    cmdLogger.info("Server running on PORT 3000");
})