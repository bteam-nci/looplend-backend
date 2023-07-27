const validate = require('jsonschema').validate;
const schemas = {
	"product": {
		type: "object",
		properties: {
			name: {
				type: "string",
				minLength: 3
			},
			image: {
				type: "string",
				format: "uri"
			},
			description: {
				type: "string",
			},
			// should be one of the values between 0 and 8, only integer values
			category: {
				type: "integer",
				minimum: 0,
				maximum: 8
			},
			// it is the amount in cents
			price: {
				type: "integer",
				minimum: 1
			},
			availabilities: {
				type: "array",
				items: {
					type: "object",
					properties: {
						start: {
							type: "string",
							format: "date"
						},
						end: {
							type: "string",
							format: "date"
						}
					},
					required: ["start"]
				}
			}
		},
		required: ["name", "price"]
	},
	"rental": {
		type: "object",
		properties: {
			productId: {
				type: "string"
			},
			start: {
				type: "string",
				format: "date"
			},
			end: {
				type: "string",
				format: "date"
			},
		},
		required: ["productId", "start", "end"]
	}
}
module.exports.product =  (product) => {
	return validate(product, schemas.product).valid;
}
module.exports.rental =  (rental) => {
	return validate(rental, schemas.rental).valid;
}
