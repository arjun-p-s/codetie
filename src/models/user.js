const mongoose = require("mongoose");

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
  },
  password: {
    type: String,
    require: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  photourl:{
    type:String,
  },
  about:{
    type:String,
    default:"This is a default value of User",
  },
  skills:{
    type:[String],
  }
});

module.exports = mongoose.model("User", userSchema);
