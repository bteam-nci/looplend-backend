module.exports.list = async (rentalId, dbInstance) => {
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

module.exports.listMessages = async (rentalInput, dbInstance) => {
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

module.exports.add = async (rentalId, dbInstance) => {
	return dbInstance("rentals").where("id", rentalId).update({
		status: 2
	});
}

