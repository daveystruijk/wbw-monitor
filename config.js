require('dotenv').config();

const config = {
  username: process.env.WBW_USER,
  password: process.env.WBW_PASSWORD,
  list: process.env.WBW_LIST,
  headless: process.env.WBW_HEADLESS === "1",
};

module.exports = config;
