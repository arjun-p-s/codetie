const express = require("express");
const { userAuth } = require("../config/middleviers/auth");
const { editedValidateData } = require("../config/utils/validation");
const validator = require("validator");
const bcrypt = require("bcrypt");

const authProfile = express.Router();
authProfile.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
authProfile.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!editedValidateData(req)) {
      throw new Error("invalid Data");
    }
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    loggedInUser.save();
    res.json({ message: "User updated successfull" });
  } catch (err) {
    res.status(400).send("Error :" + err.message);
  }
});

authProfile.patch("/password/update", userAuth, async (req, res) => {
  const { password: newPassword } = req.body;

  try {
    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Please enter a Strong password");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    req.user.password = hashedPassword;
    await req.user.save();
    res.send("password Updated Successfully");
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = authProfile;
