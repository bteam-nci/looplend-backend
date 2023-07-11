const attachDb = require("./libs/db");
const products = require("./libs/repositories/products");
const apigHelper = require("./libs/apigHelper");
const {product: validator} = require("./libs/validators");

module.exports.createProduct = attachDb(async (event, context) => {
	const userId = context.userId;
	const dbInstance = context.dbInstance;

	const productInput = JSON.parse(event.body ?? "{}");

	if (!validator(productInput)) {
		return apigHelper.badRequest({
			"message": "Invalid product"
		});
	}
	// create base product
	const baseProduct = {
		...productInput,
		ownerId: userId
	}
	// upload image

	const product = await products.create(baseProduct, dbInstance);

	return apigHelper.returnEntity(product);
});
