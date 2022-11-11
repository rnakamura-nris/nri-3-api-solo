const bodyParser = require("body-parser");

const setupServer = () => {
  /**
   * Create, set up and return your express server, split things into separate files if it becomes too long!
   */
  const express = require("express");
  const app = express();
  app.use(bodyParser.json());

  app.get("/", (req, res) => {
    res.send("now running...");
  });

  return app;
};

module.exports = { setupServer };
