const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  age: {
    type: Number,
  },
  phnno: {
    type: Number,
  },
});


module.exports = mongoose.model("User", userSchema);
