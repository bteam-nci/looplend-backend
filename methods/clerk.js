const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const users = require("./libs/repositories/users");
const { Webhook  } = require("svix");

module.exports.clerkWebhook = attachDb(async (event, context) => {
	// validate the webhook
	const wh = new Webhook("whsec_V+kWM7L7e12jmEJbhc2zeN97h9tbQVca");
	const payload = wh.verify(event.body, event.headers);
	if (payload.type === "user.created" || payload.type === "user.updated") {
		const dbInstance = context.dbInstance;
		try{
			const user = await users.create({
				id: payload.data.id,
				fullName: `${payload.data.first_name} ${payload.data.last_name}`,
			}, dbInstance);
			return apigHelper.returnEntity(user);
		}catch (e) {
			return apigHelper.error({
				"message": e.message
			}, 400);
		}
	}
	return apigHelper.error({
		"message": "Webhook type not supported."
	}, 400);
});

