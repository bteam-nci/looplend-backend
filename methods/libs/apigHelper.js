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

module.exports.badRequest = (body) => {
	return {
		statusCode: 400,
		body: JSON.stringify(body),
		headers: {
			...baseHeaders
		}
	}
}
// a map Entity._type -> [field1, field2, ...]
const fieldsToMask = {
	"User": ["createdAt"],
	"Product": ["createdAt", "ownerId", "availabilities.productId"]
}
function maskEntity(subject, fields){
	for (let field of fields){
		subject = deleteField(subject, field);
	}
	return subject;
}
function deleteField(subject, field) {
	let path = field.split(".");
	if (Array.isArray(subject)) {
		subject.forEach((item) => {
			deleteField(item, field);
		})
	} else {
		Object.keys(subject).forEach((key) => {
			if (key === path[0]) {
				if (path.length > 1) {
					path.shift();
					deleteField(subject[key], path.join("."));
				} else {
					delete subject[key];
				}
			}
		})
	}
	return subject;
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
