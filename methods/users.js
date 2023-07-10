const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const users = require("./libs/repositories/users");

module.exports.getUserInfo = attachDb(async (event, context) => {
	const userId = context.userId;
	const dbInstance = context.dbInstance;
	const user = await users.get(userId, dbInstance);
	if(!user) {
		return apigHelper.error({
			"message": "User authenticated but not found in database."
		}, 404);
	}
	return apigHelper.returnEntity(user);
});
