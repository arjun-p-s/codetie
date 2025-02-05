const jwt = require("jsonwebtoken");
const User = require("../../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Invalid token");
    }
    const decodedMessage = jwt.verify(token, "your_secret_key");
    const { userId } = decodedMessage;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User canot be founded");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

module.exports = {
  userAuth,
};
