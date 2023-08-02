const PAGE_LIMIT = 25;

module.exports.list = async (rentalId, dbInstance) => {
	const {page, rID} = params;
	const query = dbInstance("conversation_messages").where("rentalId", rID);
	const total = await query.clone().count("*", {as: "total"}).first();

	const products = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [products.map(p => ({
		value: p,
		_type: "Product"
	})), parseInt(total.total)];
}

module.exports.listMessages = async (params, dbInstance) => {
	const {page, rID} = params;
	const query = dbInstance("conversation_messages").where("rentalId", rID);
	const total = await query.clone().count("*", {as: "total"}).first();

	const messages = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [messages.map(p => ({
		value: p,
		_type: "message"
	})), parseInt(total.total)];
}

module.exports.add = async (rentalId, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 2
	});
}
