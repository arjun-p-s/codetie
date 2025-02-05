const express = require("express");
const app = express();
const { dbConnect } = require("./config/database");
const { model } = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const authRouter = require("../src/routes/auth");
const authProfile = require("../src/routes/profile");
const authRequest = require("./routes/request");

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", authProfile);
app.use("/", authRequest);

dbConnect()
  .then(() => {
    console.log("database connected successfully...");
    app.listen(3000, () => {
      console.log("server is running in port 3000");
    });
  })
  .catch((err) => {
    console.error("Database connection failed: ", err.message);
  });
