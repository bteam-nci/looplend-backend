module.exports.success = (body) => {
	return {
		statusCode: 200,
		body: JSON.stringify(body),
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		}
	}
};

module.exports.error = (body, statusCode) => {
	return {
		statusCode: statusCode ?? 500,
		body: JSON.stringify(body),
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		}
	}
}
