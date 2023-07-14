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
	"User": ["createdAt", "products.ownerId"],
	"Product": ["createdAt", "ownerId", "availabilities.productId", "owner.createdAt"],
	"Rental": ["productId", "borrowerId", "product.createdAt", "product.ownerId", "borrower.createdAt"],
}
function maskEntity(subject, type){
	const fields = fieldsToMask[type];
	if (!fields) return subject;
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

module.exports.returnList = (list, page, total, statusCode) => {
	const localList = list.map((entity) => maskEntity(entity));
	return {
		statusCode: statusCode ?? 200,
		body: JSON.stringify({
			data: localList,
			count: localList.length,
			page,
			total
		}),
		headers: {
			...baseHeaders
		}
	}
};

// this module takes an entity, and it returns a response object with the entity (some of the fields are masked)
module.exports.returnEntity = (entity, statusCode) => {
	const localEntity = maskEntity(entity.value, entity._type);
	return {
		statusCode: statusCode ?? 200,
		body: JSON.stringify(localEntity),
		headers: {
			...baseHeaders
		}
	}
};

module.exports.getUserId = (event) => {
	const userId = event.requestContext?.authorizer?.userId;
	if (!userId) throw new Error("Unauthorized");
	return userId;
}
