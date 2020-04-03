/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const User = require("../models/user");
const Setting = require("../models/setting");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); // for authaurization chek

exports.signup = (req, res) => {
  // validation des valeur entrer par l'user
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  //si validation ok, alors on éssaie d'enregistrer
  //on met a jour le nom à afficher
  const userBody = { ...req.body, nomAfficher: req.body.nom };

  const user = new User(userBody);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }

    // pour cacher les password et slat
    user.hashed_password = undefined;
    user.salt = undefined;

    res.json({
      user
    });
  });
  // console.log(user);
};

// connection
exports.signin = (req, res) => {
  // on retrouve un utilisateur correspondant au email
  console.log(req.body.user);
  const { email, password } = req.body.user;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "Il n'existe aucun utilisateur correspondant à ce email "
      });
    }

    // if user is found make sure the email and password match
    //  wish check her password

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "L'email ou mot de passe non valide"
      });
    }

    //generate a signed token with user id and secret
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    //persit the token as 't' in cookie with expiry date
    res.cookie("t", token, { expire: new Date() + 999 });
    res.cookie("u", user._id, { expire: new Date() + 999 });

    // return response with user and token to frontend cleint
    const { _id, nom, email, phone, nomAfficher, role, address, store } = user;

    Setting.findOne({ name: "woocommerceApi" })
      .select("content")
      .exec((err, woocommerceApi) => {
        return res.json({
          token,
          user: { _id, nom, email, phone, nomAfficher, role, address, store },
          woocommerceApi: woocommerceApi.content
        });
      });
  });
};

// avec cette méthode il risque de se déconnecté sur tout les différent naviguateur
// donc y ajouter l'id de la ssesion
exports.signout = (req, res) => {
  res.clearCookie("t");
  res.json({ message: "Signout success" });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth"
});

// controler l'accès aux information d'autruit
exports.isAuth = (req, res, next) => {
  // on verifie si il existe un profile ( issue de :userId )
  //en cours et une authorisation ( requireSignin ) et que les deux entité ont le même id
  // si non on refuse l'accès

  let user = req.profile && req.auth && req.profile.id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: "Access refusé"
    });
  }
  next();
};

// verifie critère admin
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Droit d'administrateur! Accès refusé"
    });
  }
  next();
};

exports.update = (req, res) => {
  const user = req.profile;
  const errors = validationResult(req);

  console.log(" validator ");
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  for (let [key, value] of Object.entries(req.body)) {
    user[key] = req.body[key];
  }

  if (req.body.password) {
    const { password, newPassword, confirmation } = req.body;
    console.log(" password ");

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Le mot de passe saisi n'est pas valide"
      });
    }
    user.password = req.body.newPassword;
  }

  user.save((err, newUser) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    console.log(" exec ");
    newUser.salt = undefined;
    user.hashed_password = undefined;
    const { _id, nom, email, phone, role, address, store } = newUser;

    
    res.json({
      user: { _id, nom, email, phone, role, address, store },
      profile: newUser
    });
  });
};
