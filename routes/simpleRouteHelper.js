const express = require("express");

const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const { userById } = require("../controllers/user");

exports.routeHelper = (
  name,
  pluriName,
  create,
  read,
  remove,
  update,
  list,
  byId,
  validator,
  router,
  moreRoutes,
  removeMany,
  updateMany
) => {
  moreRoutes && moreRoutes();
  if (create)
    router.post(
      `/${name}/create/:userId`,
      requireSignin,
      isAuth,
      isAdmin,
      validator,
      create
    );

  // eslint-disable-next-line no-
  
  update &&
    router.put(
      `/${name}/:${name}Id/:userId`,
      requireSignin,
      isAuth,
      isAdmin,
      validator,
      update
    );

    
  updateMany &&
    router.post(`/${pluriName}/:userId`, requireSignin, isAdmin, isAuth, updateMany);

  router.delete(
    `/${name}/:${name}Id/:userId`,
    requireSignin,
    isAdmin,
    isAuth,
    remove
  );

  removeMany &&
    router.delete(
      `/${pluriName}/:userId`,
      requireSignin,
      isAdmin,
      isAuth,
      removeMany
    );

  router.get(`/${name}/:${name}Id`, read);
  router.get(`/${pluriName}/:userId`, requireSignin, isAuth, isAdmin, list);

  // paramètre dans la route
  router.param("userId", userById);
  router.param(`${name}Id`, byId);

  return router;
};
