const baseHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Credentials": true,
}

module.exports.success = (body) => {
	return {
		statusCode: 200,
		body: JSON.stringify(body),
		headers: {
			...baseHeaders
		}
	}
};

module.exports.error = (body, statusCode) => {
	return {
		statusCode: statusCode ?? 500,
		body: JSON.stringify(body),
		headers: {
			...baseHeaders
		}
	}
}
// a map Entity._type -> [field1, field2, ...]
const fieldsToMask = {
	"User": ["createdAt"]
}

function maskEntity(entity) {
	const type = entity._type;
	if (!type) throw new Error("Entity type not specified");
	const fields = fieldsToMask[type];
	if (!fields) {
		return entity;
	}
	const maskedEntity = { ...entity };
	for (const field of fields) {
		maskedEntity[field] = undefined;
	}
	return maskedEntity;
}

// this module takes an entity, and it returns a response object with the entity (some of the fields are masked)
module.exports.returnEntity = (entity, statusCode) => {
	const localEntity = maskEntity(entity);
	return {
		statusCode: statusCode ?? 200,
		body: JSON.stringify(localEntity),
		headers: {
			...baseHeaders
		}
	}
};
