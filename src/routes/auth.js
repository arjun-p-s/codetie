const express = require("express");
const { signupValidateData } = require("../config/utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    signupValidateData(req);
    const {
      firstName,
      lastName,
      age,
      gender,
      password,
      email,
      about,
      photourl,
      skills,
    } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      age,
      gender,
      password: passwordHash,
      email,
      about,
      photourl,
      skills,
    });

    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!validator.isEmail(email)) {
      throw new Error("Email id is not valid");
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send(" Incorrect Email Id or Password ");
    }

    const isPasswordCorrect = await user.validatePassword(password);

    if (isPasswordCorrect) {
      const token = await user.getJWT();
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None"  ,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      res.send(user);
    } else {
      return res.status(404).send(" Incorrect Email Id or Password ");
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("Successfully logged out");
});
module.exports = authRouter;
