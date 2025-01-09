const express = require("express");
const app = express();
const { dbConnect } = require("./config/database");
const User = require("./config/models/user");

app.post("/signup", async (req, res) => {
  const user = new User({
    firstName: "Arjun ",
    LastName: "Susheelan",
    age: "22",
    phnno: "123452637",
  });
  await user.save();
  res.send("User added successfully");
});

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
