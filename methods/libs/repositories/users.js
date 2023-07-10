module.exports.get = async (userId, dbInstance) => {
	return {
		value: dbInstance("users").where("id", userId).first(),
		_type: "User"
	}
}

module.exports.create = async (user, dbInstance) => {
	return dbInstance("users").insert(user).onConflict(["id"]).merge().returning("*");
}

