const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const products = require("./libs/repositories/products");
const wishlist = require("./libs/repositories/wishlist");

module.exports.removeProduct = attachDb(async (event, context) => {
	const dbInstance = context.dbInstance;
	const userId = apigHelper.getUserId(event);
	const {pID} = event.pathParameters ?? {};
	const product = await products.get({productId: pID}, dbInstance);
	if (!product) {
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	await wishlist.remove(pID, userId, dbInstance);
	return apigHelper.returnEntity(product);
});

module.exports.addProduct = attachDb(async (event, context) => {
	const dbInstance = context.dbInstance;
	const userId = apigHelper.getUserId(event);
	const {pID} = event.pathParameters ?? {};
	const product = await products.get({productId: pID}, dbInstance);
	if (!product) {
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	await wishlist.add(pID, userId, dbInstance);
	return apigHelper.returnEntity(product);
});

module.exports.list = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const {page} = event.queryStringParameters ?? {};

	const [list, total] = await wishlist.list(userId, page, dbInstance);

	return apigHelper.returnList(list, page, total);
});
