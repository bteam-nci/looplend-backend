const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const rentals = require("./libs/repositories/rentals");
const conv = require("./libs/repositories/conv");

module.exports.listMessages = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const {page} = event.queryStringParameters ?? {};
	const {rID} = event.pathParameters ?? {};

	if (page && isNaN(page)) {
		return apigHelper.badRequest({
			"message": "Invalid page"
		});
	}

	const rental = await rentals.get(rID,  dbInstance);
	if(!rental){
		return apigHelper.error({
			"message": "Rental not found"
		}, 404);
	}
	if (rental.value.ownerId !== userId && rental.value.borrowerId !== userId) {
		return apigHelper.error({
			"message": "Not authorized to view this rental"
		}, 401);
	}

	const [messages, total] = await conv.listMessages({
		page: page ?? 1,
		rID,
		userId
	}, dbInstance);

	return apigHelper.returnList(messages, page, total);
});
module.exports.sendMessage = attachDb(async (event, context) => {
	const userId = apigHelper.getUserId(event);
	const dbInstance = context.dbInstance;
	const { text } = JSON.parse(event.body);
	const { rID } = event.pathParameters ?? {};

	const rental = await rentals.get(rID,  dbInstance);
	if(!rental){
		return apigHelper.error({
			"message": "Rental not found"
		}, 404);
	}
	if (rental.value.ownerId !== userId && rental.value.borrowerId !== userId) {
		return apigHelper.error({
			"message": "Not authorized to view this rental"
		}, 401);
	}

	if(rental.value.status === "COMPLETED" || rental.value.status === "DENIED"){
		return apigHelper.error({
			"message": "Rental is not active"
		}, 400);
	}

	const message = await conv.sendMessage({
		text,
		userId,
		rID
	}, dbInstance);

	return apigHelper.returnEntity(message);
});
