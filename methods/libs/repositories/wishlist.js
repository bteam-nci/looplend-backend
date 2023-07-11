const PAGE_LIMIT = 20;

module.exports.add = async (productId, userId, dbInstance) => {
	return dbInstance("users_wishlists").insert({
		productId,
		userId,
	}).onConflict(["productId", "userId"]).merge();
}

module.exports.remove = async (productId, userId, dbInstance) => {
	return dbInstance("users_wishlists").where("productId", productId).where("userId", userId).del();
}

module.exports.list = async (userId, page, dbInstance) => {
	const query = dbInstance("users_wishlists").where("userId", userId).join("products", "users_wishlists.productId", "products.id").select("products.*").select("users_wishlists.addedAt");

	const total = await query.clone().count("*", { as: "total" }).first();
	const products = await query.clone().orderBy("addedAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [products.map(p=>({
		...p,
		_type: "Product"
	})), parseInt(total.total)];
}


