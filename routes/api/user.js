const express = require("express");
const routerRegister = express.Router();
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const Jimp = require("jimp");
const nodemailer = require("nodemailer");

const {
  registerContact,
  listContact,
  checkEmail,
  checkUserById,
  checkUserByIdAndUpdate,
  checkUserByVerificationTokenAndUpdate,
} = require("../../models/user");

const loginHandler = require("../../auth/loginHandler");
const { registrationSchema } = require("../../models/validation");
const authorize = require("../../auth/auth");

const storeImagesTmp = path.join(process.cwd(), "tmp");
const storeAvatars = path.join(process.cwd(), "public/avatars");

const storageTmp = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storeImagesTmp);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 1048576,
  },
});

const uploadTmp = multer({ storage: storageTmp });

const getAuth = async () => {
  const emailUser = await nodemailer.createTestAccount();
  const etherealAuth = {
    user: emailUser.email,
    pass: emailUser.password,
  };
  if (etherealAuth.user && etherealAuth.pass) return etherealAuth;

  return nodemailer.createTestAccount();
};

routerRegister.post("/signup", uploadTmp.single("avatar"), async (req, res) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const { email } = req.body;
  const users = await checkEmail({ email: email });

  if (users !== null) {
    return res.status(400).send("Email in use");
  }

  try {
    const { email, password } = req.body;
    const user = await registerContact(email, password);
    const link = `localhost:3600/api/users/verify/:${user.verificationToken}`;

    const auth = await getAuth();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth,
    });
    const info = await transporter.sendMail({
      from: '"admin" <admin@admin.com>',
      to: user.email,
      subject: `Hello ${user.email}`,
      text: `Please verify your account on the link below: localhost:3600/api/users/verify/:${user.verificationToken}`,
      html: `<h1>Please verify your account Dear ${user.email}</h1>
              <h2>Click on the link below</h2>
              <a href=${link}>Click here to verify</a>`,
    });

    const previewURL = nodemailer.getTestMessageUrl(info);

    return res
      .status(201)
      .json(`User registered, verify account on ` + previewURL);
  } catch {
    return res.status(500).send("Something went wrong");
  }
});

routerRegister.get("/current", authorize, async (req, res) => {
  try {
    const id = req.user.id;
    const users = await checkUserById(id);

    const payload = {
      email: users.email,
      subscription: users.subscription,
      verify: users.verify,
      verificationToken: users.verificationToken,
    };

    res.status(200).json(payload);
  } catch {
    return res.status(401).send("Not authorized");
  }
});

routerRegister.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const token = await loginHandler(email, password);
    if (token) {
      return res.status(200).send(token);
    } else {
      return res.status(401).send("Wrong user credentials");
    }
  } catch (err) {
    return res.status(404).send(err);
  }
});

routerRegister.get("/logout", authorize, async (req, res) => {
  const id = req.user.id;
  const newToken = null;
  try {
    await checkUserByIdAndUpdate(id, { token: newToken });
    return res.status(204).send("No content");
  } catch (err) {
    return res.status(500).send(err);
  }
});

routerRegister.patch(
  "/avatars",
  authorize,
  uploadTmp.single("avatar"),
  async (req, res) => {
    const id = req.user.id;
    const { path: temporaryName } = req.file;
    const newName = `${req.user.email}.jpg`;
    const fileName = path.join(storeAvatars, newName);
    const newURL = `localhost:3600/avatars/${newName}`;

    try {
      await checkUserByIdAndUpdate(id, { avatarURL: newURL });
      await fs.rename(temporaryName, fileName);
      Jimp.read(fileName, (err, image) => {
        if (err) throw err;
        image
          .resize(256, 256) // resize
          .write(fileName); // save
      });
      return res.status(200).send(newURL);
    } catch (err) {
      await fs.unlink(temporaryName);
      return res.status(500).send(err);
    }
  }
);
routerRegister.get(
  "/verify/:verificationToken",
  authorize,
  async (req, res) => {
    const verificationToken = req.user.verificationToken;

    try {
      const result = await checkUserByVerificationTokenAndUpdate(
        { verificationToken: verificationToken },
        { verify: true, verificationToken: null }
      );
      if (!result) {
        return res.status(404).send("Not found");
      }

      return res.status(200).send("Verification succesful");
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

routerRegister.post("/verify", authorize, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).send("Missing required field email");
  }

  const users = await checkEmail({ email: email });
  const { verificationToken, verify } = users;
  if (verificationToken && verify !== true) {
    const link = `localhost:3600/api/users/verify/:${users.verificationToken}`;
    const auth = await getAuth();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth,
    });
    const info = await transporter.sendMail({
      from: '"admin" <admin@admin.com>',
      to: users.email,
      subject: `Hello ${users.email}`,
      text: `Please verify your account on the link below: localhost:3600/api/users/verify/:${users.verificationToken}`,
      html: `<h1>Please verify your account Dear ${users.email}</h1>
                <h2>Click on the link below</h2>
                <a href=${link}>Click here to verify</a>`,
    });
    const previewURL = nodemailer.getTestMessageUrl(info);

    res.status(200).send("Verification email sent to" + previewURL);
  }
  if (verificationToken == null && verify == true) {
    res.status(400).send("Verification has already been passed");
  }
});

module.exports = routerRegister;
