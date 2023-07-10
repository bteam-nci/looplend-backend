module.exports.get = async (userId, dbInstance) => {
	return {
		value: dbInstance("users").where("id", userId).first(),
		_type: "User"
	}
}

