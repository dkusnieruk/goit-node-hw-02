const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");

const user = new Schema({
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
  avatarURL: {
    type: String,
  },
});

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
};

const User = mongoose.model("users", user);

const registerContact = async (email, password) => {
  const hashedPassword = hashPassword(password);
  const gravatarURL = gravatar.url(email);
  const user = new User({
    email,
    password: hashedPassword,
    avatarURL: gravatarURL,
  });

  user.save();
  return user;
};

const listContact = async () => {
  const users = await User.find();
  return users;
};

const checkEmail = async (email) => {
  const users = await User.findOne(email);
  return users;
};

const checkUserById = async (_id) => {
  const users = await User.findById(_id);
  return users;
};

const checkUserByIdAndUpdate = async (_id, token, avatarURL) => {
  const usersUpdate = await User.findByIdAndUpdate(_id, token, avatarURL);
  return usersUpdate;
};

module.exports = {
  registerContact,
  listContact,
  checkEmail,
  hashPassword,
  checkUserById,
  checkUserByIdAndUpdate,
};
