/* eslint-disable no-console */
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const http = require("http");

const cookieParser = require("cookie-parser");
const cors = require("cors");

const {
  errorHandler,
  checkErrorFromDataBase
} = require("./helpers/dbErrorHandler");

require("dotenv").config();

// import route
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const CategorieRoutes = require("./routes/category");
const postRoute = require("./routes/post");
const wooRoute = require("./woocommerce/routes");
const settingRoute = require("./routes/setting");

const port = process.env.PORT || 8000;

// db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    autoIndex: true
  })
  .then(() => console.log("DB Connecteds"));

mongoose.set("useFindAndModify", false);
const app = express();
const server = http.createServer(app);

// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cookieParser());

Array.prototype.uniqueFields = function() {
  let self = [];
  for (let i = 0; i < this.length; i++) {
    if (!self.includes(this[i])) self = [...self, this[i]];
  }
  return self;
};

app.use(cors());

//routes mildware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", CategorieRoutes);
app.use("/api", postRoute);
app.use("/api", wooRoute);
app.use("/api", settingRoute);

server.listen(port, () => {
  console.log(`Server is runing on port ${port};`);
});

app.use(function(err, req, res, next) {
  if (err) {
    console.log({ err });
    res.status(500).send({ error: err.message });
  }
});
