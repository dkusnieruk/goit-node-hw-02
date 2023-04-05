const mongoose  = require("mongoose");

const Schema = mongoose.Schema

const user = new Schema({
    password: {
        type: String,
        required: [true, 'Password is required'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
      },
      subscription: {
        type: String,
        enum: ["starter", "pro", "business"],
        default: "starter"
      },
      token: {
        type: String,
        default: null,
      },
})

const User = mongoose.model("user", user);

const registerUser = async (email , password) => {
    const user = new User ({email, password})
    user.save();
    return user;
};

const checkUser = async (email) =>{
    const user = User.findOne(email)
    return user
}

module.exports = {
    registerUser, 
    checkUser
}