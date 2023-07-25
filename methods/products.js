const attachDb = require("./libs/db");
const products = require("./libs/repositories/products");
const apigHelper = require("./libs/apigHelper");
const {product: validator} = require("./libs/validators");

module.exports.createProduct = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
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

module.exports.deleteProduct = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;

	const product = await products.get(event.pathParameters.pID, dbInstance);

	if(!product){
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	if(product.value.ownerId !== userId){
		return apigHelper.error({
			"message": "Not authorized to delete this product"
		}, 401);
	}
	await products.delete(event.pathParameters.pID, dbInstance);

	return apigHelper.success({
		"message": "Product deleted"
	})
});

module.exports.getProduct = attachDb(async (event, context) => {
	const dbInstance = context.dbInstance;
	const {extendedEntity} = event.queryStringParameters ?? {};

	const product = await products.get(event.pathParameters.pID, dbInstance, extendedEntity);

	if(!product){
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	return apigHelper.returnEntity(product);
});

module.exports.editProduct = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;

	const productInput = JSON.parse(event.body ?? "{}");

	if (!validator(productInput)) {
		return apigHelper.badRequest({
			"message": "Invalid product"
		});
	}
	const product = await products.get(event.pathParameters.pID, dbInstance);

	if(!product){
		return apigHelper.error({
			"message": "Product not found"
		}, 404);
	}
	if(product.value.ownerId !== userId){
		return apigHelper.error({
			"message": "Not authorized to delete this product"
		}, 401);
	}

	// create base product
	delete productInput.ownerId;
	delete productInput.availabilities;
	delete productInput.createdAt;
	productInput.id = event.pathParameters.pID;

	const resultProduct = await products.edit(productInput, dbInstance);

	return apigHelper.returnEntity(resultProduct);
});

module.exports.listProducts = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const {page, category, priceEnd, dateStart, dateEnd} = event.queryStringParameters ?? {};
	if (page && isNaN(page)) {
		return apigHelper.badRequest({
			"message": "Invalid page"
		});
	}
	if (((priceEnd && isNaN(priceEnd)) || priceEnd <= 0)) {
		return apigHelper.badRequest({
			"message": "Invalid priceEnd"
		});
	}
	if ((dateStart && isNaN(Date.parse(dateStart))) && (dateEnd && isNaN(Date.parse(dateEnd)))) {
		return apigHelper.badRequest({
			"message": "Invalid date range"
		});
	}
	const [productsList, total] = await products.list({
		page: page ?? 1,
		category: category ?? null,
		priceEnd: priceEnd ?? null,
		dateStart: dateStart ?? null,
		dateEnd: dateEnd ?? null
	}, userId, dbInstance);

	return apigHelper.returnList(productsList, page, total);
});
