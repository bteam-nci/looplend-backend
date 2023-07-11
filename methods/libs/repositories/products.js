module.exports.get = async (productId, dbInstance) => {
	const product = await dbInstance("products").where("id", productId).first();
	if (!product) {
		return null;
	}
	product.availabilities = await dbInstance("products_availabilities").where("productId", productId);
	return {
		value: product,
		_type: "Product"
	}
}

module.exports.create = async (product, dbInstance) => {
	// create the product
	const value = await dbInstance("products").insert(product).returning("*");
	// insert the availabilities
	const availabilities = product.availabilities.map((availability) => {
		return {
			...availability,
			productId: value[0].id
		}
	});
	await dbInstance("products_availabilities").insert(availabilities);
	return {
		value: value[0],
		_type: "Product"
	}
}

