const { check } = require("express-validator");

exports.userSignupValidator = [
  check("nom", "Vous devez saisir un nom et prénom")
    .not()
    .isEmpty(),
  check(
    "email",
    " l'address mail doit contenir entre 3 et 32 caractères y compris '@'"
  ).isEmail(),
  check("password", "Password is required")
    .not()
    .isEmpty(),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .matches(/\d/)
    .withMessage("Le mot de passe doit contenir au moins un chiffre")
];

exports.categoryCreateValidator = [
  check("name", "Vous devez saisir un nom")
    .not()
    .isEmpty()
];

exports.userUpdateProfileValidator = [
  check("nom", "Vous devez saisir un nom")
    .not()
    .isEmpty(),
  check("prenom", "Vous devez saisir un prénom")
    .not()
    .isEmpty(),
  check(
    "email",
    " l'address mail doit contenir entre 3 et 32 caractères y compris '@'"
  ).isEmail(),
  check("password").custom((password, { req }) => {
    if (password) {
      if (!req.body.newPassword) {
        throw new Error("Vous devez saisir un nouveau mot de passe");
      }
      if (password === req.body.newPassword) {
        throw new Error(
          "Le nouveau mot de passe doit être différent de l'ancien "
        );
      }
      if (!req.body.newPassword.match(/\d/)) {
        throw new Error(
          "Le nouveau mot de passe doit contenir au moins un chiffre "
        );
      }
      if (!req.body.confirmation) {
        throw new Error("Confirmation is required ");
      }

      if (req.body.newPassword !== req.body.confirmation) {
        throw new Error(
          "new password and confirmation password must be equals"
        );
      }
    }

    return true;
  })
];

exports.addressCreateValidator = [
  check("name", "Vous devez saisir un nom du réceptionnaire")
    .not()
    .isEmpty(),
  check("description", "Vous devez inserer une address")
    .not()
    .isEmpty(),
  check("phone", " Vous devez saisir au moins une address à contacter")
    .not()
    .isEmpty()
];

exports.fileValidator = [
  check("name", "Vous devez saisir un libellé")
    .not()
    .isEmpty()
];

exports.storeValidator = [
  check("name", "Vous devez saisir le nom de la boutique")
    .not()
    .isEmpty()
];

exports.productValidator = [
  check("name", "Vous devez saisir un nom pour le produit")
    .not()
    .isEmpty(),
  check("prices.price", "Vous devez saisir un prix")
    .not()
    .isEmpty()
];

exports.promoValidator = [
  check("name", "Vous devez saisir un nom pour la promo")
    .not()
    .isEmpty(),
  check("code", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty()
];

exports.catalogValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),

  check("store", "Vous devez définir le magasin ")
    .not()
    .isEmpty()
];
exports.wholesaleValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),

  check("ugs", "Vous devez définir un code isbn ou ugs ")
    .not()
    .isEmpty()
];

exports.variantPriceValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty()
];

exports.tagValidator = [
  check("name", "Vous devez définir un nom")
    .not()
    .isEmpty(),

  check("type", "Vous devez spécifier le type ")
    .not()
    .isEmpty()
];

exports.providerValidator = [
  check("name", "Vous devez saisir un nom pour le fournisseur")
    .not()
    .isEmpty()
];
exports.postValidator = [
  check("content", "Vous devez saisir un nom pour le ce post")
    .not()
    .isEmpty()
];

exports.settingValidator = [
  check("content", "Vous devez saisir le contenu pour cette configuration")
    .not()
    .isEmpty()
];

exports.variantValidator = [];
