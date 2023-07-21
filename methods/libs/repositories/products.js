const PAGE_LIMIT = 20;

module.exports.get = async (productId, dbInstance) => {
	const product = await dbInstance("products")
		.where("id", productId)
		.leftJoin("product_feedbacks", "product_feedbacks.productId", "products.id")
		.groupBy("products.id")
		.select("products.*", dbInstance.raw(`case when avg("product_feedbacks"."rating") is null then 0 else avg("product_feedbacks"."rating") end as productRating`))
		.first();
	if (!product) {
		return null;
	}
	product.owner = await dbInstance("users").where("id", product.ownerId).first();
	product.availabilities = await dbInstance("products_availability").where("productId", productId);
	return {
		value: {
			...product,
			rating: parseFloat(product.productrating).toFixed(1),
		},
		_type: "Product"
	}
}

module.exports.delete = async (productId, dbInstance) => {
	return dbInstance("products").where("id", productId).del();
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

module.exports.edit = async (product, dbInstance) => {
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

module.exports.list = async (params, userId, dbInstance) => {
	const {page, category, priceEnd, dateStart, dateEnd} = params;
	const query = dbInstance("products");

	if (category) {
		query.where("category", category);
	}
	// here should user the products_price_index
	if (priceEnd) {
		query.where("price", "<=", priceEnd);
	}
	// date range needs to check if the date range is NOT within the availabilities and if the date range is not colliding with rentals, the availabilities have start and end dates and also the rentals
	if (dateStart && dateEnd) {
		query.whereNotExists(function () {
			this.select("*").from("products_availabilities").whereRaw("products_availabilities.productId = products.id").andWhere(
				(qB) => qB
					.whereBetween("start", [dateStart, dateEnd])
					.orWhereBetween("end", [dateStart, dateEnd])
			);
		});
		query.whereNotExists(function () {
			this.select("*").from("rentals").whereRaw("rentals.productId = products.id").andWhere(
				(qB) => qB
					.whereBetween("start", [dateStart, dateEnd])
					.orWhereBetween("end", [dateStart, dateEnd])
			)
		});
	}

	const total = await query.clone().count("*", {as: "total"}).first();
	let selectParts = ["products.*", dbInstance.raw(`case when avg("product_feedbacks"."rating") is null then 0 else avg("product_feedbacks"."rating") end as productRating`)];
	if (userId) {
		selectParts.push(dbInstance.raw(`(
    select count(*)
        from "users_wishlists"
        where "users_wishlists"."productId" = "products"."id" and "users_wishlists"."userId" = ?
    ) as wishlistCount`, [userId]));
	}
	const products = await query.clone()
		.leftJoin("product_feedbacks", "product_feedbacks.productId", "products.id")
		.groupBy("products.id")
		.select(selectParts)
		.orderBy("createdAt", "desc").orderBy("productrating", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [products.map(p => ({
		value: {
			...p,
			wishlistcount: undefined,
			productrating: undefined,
			rating: parseFloat(p.productrating).toFixed(1),
			isWishlisted: p.wishlistcount > 0
		},
		_type: "Product"
	})), parseInt(total.total)];
}

module.exports.listUserProducts = async (params, userId, dbInstance) => {
	const {page} = params;
	const query = dbInstance("products").where("ownerId", userId);
	const total = await query.clone().count("*", {as: "total"}).first();
	const products = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [products.map(p => ({
		value: p,
		_type: "Product"
	})), parseInt(total.total)];
}


