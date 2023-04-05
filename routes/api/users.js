const express = require("express");
const router = express.Router();


const {
    registerUser,
    checkUser
} = require("../../models/user");

const {registerUserSchema} =
require("../../models/validation.js")

router.post("/signup", async (req, res) => {
    const { error } = registerUserSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    if (!checkUser){
        return res.status(409).send("Email in use");
    }
    try {
      const { email , password} = req.body;
      
      const user = await registerUser(email, password);
      return res.status(201).json(user);
    } catch {
      return res.status(500).send("Something went wrong");
    }
  });

  module.exports =router;