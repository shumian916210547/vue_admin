const path = require("path");

const filePath =
  process.env.NODE_ENV == "production"
    ? "/ecosystem.config.js"
    : path.join(__dirname, "../", "ecosystem.config");

const ecosystemConfig = require(filePath);

console.log(ecosystemConfig);
