const express = require("express");
const router = express.Router();
const { routeHelper } = require("./simpleRouteHelper");
const { postValidator } = require("../validator");

const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const {
  create,
  read,
  remove,
  update,
  list,
  postById,
  // listByType,
  updateMany,
  removeMany,
  formateImportList,
  extratDuplicatedId,
  extractDuplicatedName,
  importList,
  listSearch,
  pricesRangesBySearch,
  listPartialSearch
} = require("../controllers/post");

module.exports = routeHelper(
  "post",
  "posts",
  create,
  read,
  remove,
  update,
  list,
  postById,
  postValidator,
  router,
  () => {
    router.post(
      "/posts/import/:userId",
      requireSignin,
      isAdmin,
      isAuth,
      formateImportList,
      extratDuplicatedId,
      extractDuplicatedName,
      importList
    );

    router.get("/posts/search", listSearch);
    router.get("/posts/prices-ranges", pricesRangesBySearch);
    router.get("/posts/partial-search", listPartialSearch);

    router.put("/posts/:userId", requireSignin, isAdmin, isAuth, updateMany);
  },
  undefined,
  removeMany
);
