const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");

const api = require("./src/api/routes/api.routes");
app.use(bodyParser.json()); // for parsing application/json

app.use("/api", api);
app.use("/app", express.static(path.join(__dirname, "build")));
app.get("/app/*", function(req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.get("/", (req, res) => {
    res.redirect("/app");
});

const port = process.env.PORT || 9000;

app.listen(port);
