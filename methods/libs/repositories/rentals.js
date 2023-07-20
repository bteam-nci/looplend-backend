const PAGE_LIMIT = 20;

/*
Rental statuses
0 - pending
1 - accepted
2 - denied

if status is 1 and start date is in the future, then the rental is upcoming
if status is 1 and start date is in the past, then the rental is ongoing
if status is 2, then the rental is past
*/

function getStatus(rental){
	if (rental.status === 0) return "PENDING";
	if (rental.status === 2) return "DENIED";
	if (new Date(rental.startDate) > new Date()) return "UPCOMING";
	if (new Date(rental.endDate) < new Date()) return "COMPLETED";
	return "ONGOING";
}

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

	rental.status = getStatus(rental);

	return {
		value: rental,
		_type: "Rental"
	}
}

module.exports.create = async (rentalInput, dbInstance) => {
	// create the rental
	const [rental] = await dbInstance("rentals").insert(rentalInput).returning("*");

	rental.product = await dbInstance("products").where("id", rental.productId).first();

	rental.borrower = await dbInstance("users").where("id", rental.borrowerId).first();

	rental.status = getStatus(rental);

	return {
		value: rental,
		_type: "Rental"
	}
}

module.exports.deny = async (rentalId, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 2
	});
}

module.exports.accept = async (rentalId, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 1
	});
}

module.exports.list = async (userId, params, dbInstance) => {
	const { page } = params;
	const query = dbInstance("rentals").where("rentals.borrowerId", userId)
		.andWhere("rentals.status", ">", 0);

	const total = await query.clone().count("*", { as: "total" }).first();
	const rentals = await query.clone()
		.leftJoin("products", "products.id", "rentals.productId")
		.leftJoin("users", "users.id", "products.ownerId")
		.leftJoin("user_feedbacks", "user_feedbacks.userId", "users.id")
		.groupBy("rentals.id", "rentals.createdAt", "products.name", "products.image", "users.fullName")
		.select("rentals.*", "products.name as productName", "products.image as productImage", "users.fullName as ownerName", dbInstance.raw("avg(user_feedbacks.rating) as ownerRating"))
		.orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [rentals.map(p=>({
		value: {
			...p,
			productName: undefined,
			productImage: undefined,
			ownerName: undefined,
			ownerrating: undefined,
			product: {
				name: p.productName,
				image: p.productImage
			},
			owner: {
				name: p.ownerName,
				rating: parseFloat(p.ownerrating).toFixed(1)
			},
			status: getStatus(p.status)
		},
		_type: "Rental"
	})), parseInt(total.total)];
}

module.exports.listRequests = async (userId, params, dbInstance) => {
	const { page } = params;
	const query = dbInstance("rentals")
		.leftJoin("products", "products.id", "rentals.productId")
		.where("products.ownerId", userId)
		.andWhere("rentals.status", "=", 0);

	const total = await query.clone().count("*", { as: "total" }).first();
	const rentals = await query.clone()
		.leftJoin("users", "users.id", "rentals.borrowerId")
		.leftJoin("user_feedbacks", "user_feedbacks.userId", "users.id")
		.groupBy("rentals.id", "rentals.createdAt", "products.name", "products.image", "users.fullName")
		.select("rentals.*", "products.name as productName", "products.image as productImage", "users.fullName as borrowerName", dbInstance.raw("avg(user_feedbacks.rating) as borrowerRating"))
		.orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [rentals.map(p=>({
		value: {
			...p,
			productName: undefined,
			productImage: undefined,
			borrowerName: undefined,
			borrowerrating: undefined,
			product: {
				name: p.productName,
				image: p.productImage
			},
			borrower: {
				name: p.borrowerName,
				rating: parseFloat(p.borrowerrating).toFixed(1)
			}
		},
		_type: "Rental"
	})), parseInt(total.total)];
}


