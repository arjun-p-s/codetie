const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minLength: 2,
    maxLength: 25,
  },
  lastName: {
    type: String,
    minLength: 2,
    maxLength: 25,
  },
  email: {
    type: String,
    trim: true,
    require: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("email address is not valid : " + value);
      }
    },
  },
  password: {
    type: String,
    require: true,
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("password is not strong : " + value);
      }
    },
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    validate(value) {
      if (!["male", "female", "others"].includes(value)) {
        throw new Error("Invalid gender value");      }
    },
  },
  photourl: {
    type: String,
    validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("photo url is not valid : " + value);
      }
    },
  },
  about: {
    type: String,
    default: "This is a default about of User",
  },
  skills: {
    type: [String],
  },
});
userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ userId: user._id }, "your_secret_key", {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordByUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValid = await bcrypt.compare(passwordByUser, passwordHash);
  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);
