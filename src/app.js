const express = require("express");
const app = express();
const { dbConnect } = require("./config/database");
const User = require("./models/user");
const { model } = require("mongoose");

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      age: req.body.age,
      gender: req.body.gender,
      photourl: req.body.photourl,
      about: req.body.about,
      skills: req.body.about,
    });

    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});
app.get("/user", async (req, res) => {
  const userEmail = req.body.email;
  try {
    const user = await User.find({ email: userEmail });
    if (user.length === 0) {
      res.status(404).send("user not founded");
    } else {
      res.send(user);
    }
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});
app.get("/feed", async (req, res) => {
  try {
    const user = await User.find({});
    if (user.length === 0) {
      res.status(404).send("no data founded");
    } else {
      res.send(user);
    }
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});
app.get("/userId", async (req, res) => {
  try {
    const user = await User.findById(req.body._id);
    res.send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
app.delete("/user", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.body._id);
    res.send("user deleted successfully");
    console.log(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
app.patch("/user", async (req, res) => {
  const data = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.body._id, data);
    res.send("updated successfully");
    console.log(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
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
