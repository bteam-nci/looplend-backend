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
	if (rental.status === 2) return "DENIED";
	if (rental.status === 0) return "PENDING";
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

	return {
		value: {
			...rental
		},
		_type: "Product"
	}
}

module.exports.deny = async (rentalId, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 2
	});
}

module.exports.accept = async (product, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 1
	});
}

module.exports.list = async (userId, params, dbInstance) => {
	const { page } = params;
	const query = dbInstance("rentals").where("borrowerId", userId).join("products", "products.id", "rentals.productId").select("rentals.*", "products.name as productName", "products.image as productImage");

	const total = await query.clone().count("*", { as: "total" }).first();
	const rentals = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [rentals.map(p=>({
		value: {
			...p,
			productName: undefined,
			productImage: undefined,
			product: {
				name: p.productName,
				image: p.productImage
			}
		},
		_type: "Rental"
	})), parseInt(total.total)];
}

module.exports.listRequests = async (userId, params, dbInstance) => {
	const { page } = params;
	const query = dbInstance("rentals")
		.join("products", "products.id", "rentals.productId")
		.select("rentals.*", "products.name as productName", "products.image as productImage", "products.ownerId as productOwnerId")
		.where("products.ownerId", userId);

	const total = await query.clone().count("*", { as: "total" }).first();
	const rentals = await query.clone().orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [rentals.map(p=>({
		value: {
			...p,
			productName: undefined,
			productImage: undefined,
			product: {
				name: p.productName,
				image: p.productImage
			}
		},
		_type: "Rental"
	})), parseInt(total.total)];
}


