const User = require("../models/user");

exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    req.profile = user;

    next();
  });
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.info = (req, res) => {
  const { _id, nom, email, phone, role, address, store } = req.profile;
  return res.json({ _id, nom, email, phone, role, address, store });
};

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];

  req.body.order.bags.forEach(item => {
    history.push({
      id: item.id,
      bag: item.bag,
      isbn: item.isbn,
      variant: item.variant,
      name: item.name,
      quantity: item.quantity,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount
    });
  });

  userPushToHistory(res, req.profile._id, { "bags": [...history] }, () =>
    next()
  );
};

const userPushToHistory = (res, userId, newHistory, next) => {
  const key = Object.keys(newHistory)[0];
  User.findOneAndUpdate(
    { _id: userId },
    { $push: { [`history.${key}`]: newHistory[key] } },
    { new: true },
    error => {
      if (error) {
        return res.status(400).json({
          error: error
        });
      }
      next();
    }
  );
};
