const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

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
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, "Verify token is required"],
  },
});


const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
};

const generateVerifyToken = uuidv4();

const User = mongoose.model("users", user);

const registerContact = async (email, password) => {
  const hashedPassword = hashPassword(password);
  const gravatarURL = gravatar.url(email);
  const user = new User({
    email,
    password: hashedPassword,
    avatarURL: gravatarURL,
    verificationToken: generateVerifyToken,
  });

  const auth ={
    user:user.email,
    pass:user.password
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure:false,
    auth  
  })
  
  const info= await transporter.sendMail({
    from: '"admin" <foo@example.com>', 
    to: email, 
    subject: `Hello ${user.email}`,
    text: "Click below to verify your account", 
    html: `<h1>Click the link below to verify your account</h1>
            <div>
            <a href="localhost:3600/api/users/verify/:${user.verificationToken}>
            Verify account
            </a>
            </div>` 
});
  const previewURL =  nodemailer.getTestMessageUrl(info);
  console.log(previewURL);
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

const checkUserByIdAndUpdate = async (
  _id,
  token,
  avatarURL,
  verify,
  verificationToken
) => {
  const usersUpdate = await User.findByIdAndUpdate(
    _id,
    token,
    avatarURL,
    verify,
    verificationToken
  );
  return usersUpdate;
};

const checkUserByVerificationTokenAndUpdate = async (
  verificationToken,
  verify
) => {
  const usersUpdate = await User.findOneAndUpdate(verificationToken, verify);
  return usersUpdate;
};

module.exports = {
  registerContact,
  listContact,
  checkEmail,
  hashPassword,
  checkUserById,
  checkUserByIdAndUpdate,
  checkUserByVerificationTokenAndUpdate,
};
