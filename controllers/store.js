const Store = require("../models/store");
const User = require("../models/user");

const { controllerHelper } = require("./simpleControllerFactory");

const { create, read, update, remove, byId, list } = controllerHelper(
  Store,
  "store",
  true
);

// creation
exports.create = create;
exports.storeById = byId;
exports.read = (req, res) => {
  Store.findById(req.store)
    
  .populate({ path: "bag", select: "name store" })
    .exec((err, result) => {
      res.json(result);
    });
};

exports.update = (req, res) => update(req, res, store => res.json({ store }));
exports.remove = remove;
exports.list = (req, res) => {
  Store.find()
    .populate({ path: "bag", select: "name store" })
    .exec((err, result) => {
      res.json(result);
    });
};
