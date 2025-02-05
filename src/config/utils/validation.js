const validator = require("validator");

const signupValidateData = (req) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Please enter the name");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email id is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a Strong Password");
  }
};

const editedValidateData = (req) => {
  const allowedUpdates = [
    "firstName",
    "secondName",
    "age",
    "about",
    "gender",
    "skills",
  ];
  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedUpdates.includes(field)
  );
  return isEditAllowed;
};

module.exports = {
  signupValidateData,
  editedValidateData,
};
