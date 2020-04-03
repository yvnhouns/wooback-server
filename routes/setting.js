const express = require("express");
const router = express.Router();
const { routeHelper } = require("./simpleRouteHelper");
const { settingValidator } = require("../validator");

const {
  create,
  read,
  remove,
  update,
  list,
  settingById,
  // listByType,
  removeMany
} = require("../controllers/setting");

module.exports = routeHelper(
  "setting",
  "settings",
  create,
  read,
  remove,
  update,
  list,
  settingById,
  settingValidator,
  router,
  () => {},
  undefined,
  removeMany
);
