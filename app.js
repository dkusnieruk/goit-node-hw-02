const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const Jimp = require("jimp");
const { connectDatabase } = require("./startup/database");
connectDatabase();

const contactsRouter = require("./routes/api/contacts");
const registerRouter = require("./routes/api/user");
const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("tmp"));
app.use("/api/contacts", contactsRouter);
app.use("/api/users", registerRouter);
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
