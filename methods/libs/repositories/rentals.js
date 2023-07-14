const PAGE_LIMIT = 20;

module.exports.get = async (rentalId, dbInstance) => {
	const rental = await dbInstance("rentals")
		.where("id", rentalId).first();
	if (!rental) {
		return null;
	}

	rental.product = dbInstance("products")
		.where("id", rental.productId).first();

	rental.borrower = dbInstance("users")
		.where("id", rental.borrowerId).first();

	return {
		value: rental,
		_type: "Rental"
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
		value: {
			...value[0],
			availabilities
		},
		_type: "Product"
	}
}

module.exports.deny = async (productId, dbInstance) => {
	return dbInstance("products").where("id", productId).del();
}

module.exports.accept = async (product, dbInstance) => {
	// create the product
	const value = await dbInstance("products").insert(product).onConflict(["id"]).merge().returning("*");
	// insert the availabilities
	const availabilities = product.availabilities.map((availability) => {
		return {
			...availability,
			productId: product.id
		}
	});
	await Promise.all([
		dbInstance("products_availabilities").where("productId", product.id).del(),
		dbInstance("products_availabilities").insert(availabilities)
	])
	return {
		value: {
			...value[0],
			availabilities
		},
		_type: "Product"
	}
}

module.exports.list = async (userId, params, dbInstance) => {
	const { page } = params;
	const query = dbInstance("rentals").where("borrowerId", userId);

	const total = await query.clone().count("*", { as: "total" }).first();
	const products = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [products.map(p=>({
		...p,
		_type: "Product"
	})), parseInt(total.total)];
}


