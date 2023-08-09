const PAGE_LIMIT = 25;

module.exports.listMessages = async (params, dbInstance) => {
	const {page, rID} = params;
	const query = dbInstance("conversation_messages").where("rentalId", rID);
	const total = await query.clone().count("*", {as: "total"}).first();

	const messages = await query.clone().innerJoin("users", "users.id", "conversation_messages.senderId").select("conversation_messages.*", "users.fullName as senderName").orderBy("createdAt", "desc").limit(PAGE_LIMIT).offset((page - 1) * PAGE_LIMIT);

	return [messages.map(p => ({
		value: p,
		_type: "Message"
	})), parseInt(total.total)];
}

module.exports.sendMessage = async (params, dbInstance) => {
	const {text, rID, userId} = params;
	const message = await dbInstance("conversation_messages").insert({
		rentalId: rID,
		senderId: userId,
		text
	}).returning("*");
	return {
		value: message[0],
		_type: "Message"
	};
}
