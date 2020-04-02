var WooCommerceAPI = require("woocommerce-api");

var WooCommerce = new WooCommerceAPI({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_KEY,
  consumerSecret: process.env.WOOCOMMERCE_SECRET,
  queryStringAuth: true
});


exports.wooApi = WooCommerce;
