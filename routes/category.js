const express = require("express");
const router = express.Router();

const { categoryCreateValidator } = require("../validator");
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const { userById } = require("../controllers/user");
const {
  create,
  categoryById,
  read,
  remove,
  update,
  list,
  hierarchicalList,
  fullContaint
} = require("../controllers/category");

// pour creer une catégorie il faut que l'utilisateur soit connecté et soit admin


router.post(
  "/category/create/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  categoryCreateValidator,
  create
);
router.put(
  "/category/:categoryId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  // CategoryCreateValidator,
  update
);

router.delete(
  "/category/:categoryId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  remove
);
router.get("/category/:categoryId", read);

router.get("/hierarchical-categories/:categoryId", hierarchicalList);

router.get("/category/contents/:categoryId",fullContaint );

router.get("/categories/", list);


// paramètre dans la route
router.param("userId", userById);
router.param("categoryId", categoryById);
module.exports = router;
