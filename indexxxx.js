const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", require("./routes/user"));
app.use("/genre", require("./routes/genre"));
app.use("/movie", require("./routes/movie"));
app.use("/transaction", require("./routes/transaction"));
app.use("/img/movie", express.static(path.join(__dirname, "upload"))); // Get Image Movie Data

app.listen(3000, () => {
  console.log("Server is running");
});
