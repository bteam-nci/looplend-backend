const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const products = require("./libs/repositories/products");
const wishlist = require("./libs/repositories/wishlist");

module.exports.removeProduct = attachDb(async (event, context) => {
	const dbInstance = context.dbInstance;
	const userId = context.userId;
	const {pID} = event.pathParameters ?? {};
	const product = await products.get(pID, dbInstance);
	if (!product) {
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	await wishlist.remove(userId, pID, dbInstance);
	return apigHelper.returnEntity(product);
});

module.exports.addProduct = attachDb(async (event, context) => {
	const dbInstance = context.dbInstance;
	const userId = context.userId;
	const {pID} = event.pathParameters ?? {};
	const product = await products.get(pID, dbInstance);
	if (!product) {
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	await wishlist.add(userId, pID, dbInstance);
	return apigHelper.returnEntity(product);
});

module.exports.list = attachDb(async (event, context) => {
	const userId = context.userId;
	const dbInstance = context.dbInstance;
	const {page} = event.queryStringParameters ?? {};

	const [wishlist, total] = await wishlist.list(userId, page, dbInstance);

	return apigHelper.returnList(wishlist, page, total);
});
