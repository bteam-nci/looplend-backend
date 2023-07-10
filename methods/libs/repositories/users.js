module.exports.get = async (userId, dbInstance) => {
	return {
		value: dbInstance("users").where("id", userId).first(),
		_type: "User"
	}
}

module.exports.create = async (user, dbInstance) => {
	const value = await dbInstance("users").insert(user).onConflict(["id"]).merge().returning("*");
	return {
		value: value[0],
		_type: "User"
	}
}

