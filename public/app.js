const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const appName = "shumian_admin";
const filePath =
  process.env.NODE_ENV == "production"
    ? "/ecosystem.config.js"
    : "./ecosystem.config.js";

const ecosystemConfig = require(path.join(__dirname, filePath));
const config = ecosystemConfig.apps.filter((app) => app.name == appName)?.[0];
if (config.env_prod) {
  const process = {
    env: config.env_prod,
  };
  fs.writeFileSync(
    path.join(__dirname, "./config.js"),
    `window.process = ${JSON.stringify(process)}`
  );
}
// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "../dist")));

// Handle other routes and serve the Vue SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

// Start the server
const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
