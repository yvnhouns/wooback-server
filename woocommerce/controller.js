/* eslint-disable no-console */
const Post = require("../models/post");
const { wooApi } = require("./api");

const { bulkUpdateModelValues } = require("../utils");

exports.synchronize = (req, res) => {
  let products = [];
  let page = 100;
  let found = true;

  wooApi.get("products?per_page=100&page=50", (err, data) => {
    console.log("moiiiiiiii");
    products = JSON.parse(data.toJSON().body);
    res.json({ count: products.products.length, products, err });
  });
};
