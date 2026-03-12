
const express = require("express");
const app = express();

const subjectRoute = require("./subject.route");

app.use("/subjects", subjectRoute);

module.exports = app;