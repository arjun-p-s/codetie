const express = require("express");
const app = express();
const { dbConnect } = require("./config/database");
const { model } = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const authRouter = require("../src/routes/auth");
const authProfile = require("../src/routes/profile");
const authRequest = require("./routes/request");
const userRouter = require("./routes/user");
const cors = require("cors");
require('dotenv').config()

app.use(
  cors({
    
    origin: "https://codetie-1.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", authProfile);
app.use("/", authRequest);
app.use("/", userRouter);

dbConnect()
  .then(() => {
    console.log("database connected successfully...");
    app.listen(process.env.PORT, () => {
      console.log("server is running in port 5000");
    });
  })
  .catch((err) => {
    console.error("Database connection failed: ", err.message);
  });
