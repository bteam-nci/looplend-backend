const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const users = require("./libs/repositories/users");
const rentals = require("./libs/repositories/rentals");
const products = require("./libs/repositories/products");

module.exports.getUserInfo = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const user = await users.get(userId, dbInstance);
	if(!user) {
		return apigHelper.error({
			"message": "User authenticated but not found in database."
		}, 404);
	}
	return apigHelper.returnEntity(user);
});

module.exports.getUserRentalRequests = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const {page} = event.queryStringParameters ?? {};

	const [requests, total] = await rentals.listRequests(userId, {page}, dbInstance);

	return apigHelper.returnList(requests, page, total);
});

module.exports.listUserProducts = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const {page} = event.queryStringParameters ?? {};
	if (page && isNaN(page)) {
		return apigHelper.badRequest({
			"message": "Invalid page"
		});
	}
	const [productsList, total] = await products.listUserProducts({
		page: page ?? 1,
	}, userId, dbInstance);

	return apigHelper.returnList(productsList, page, total);
});
