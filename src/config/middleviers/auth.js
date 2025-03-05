const jwt = require("jsonwebtoken");
const User = require("../../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    console.log(token)
    if (!token) {
      return res.status(401).send("please login")
    }
    const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decodedMessage;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("Invalid Username or Password");
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
