const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

const issueToken = (user) => {
  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, jwtSecret);
  return token;
};

module.exports = issueToken;
