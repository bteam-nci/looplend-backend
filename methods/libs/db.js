const initKnex = require('knex');
let dbInstance = null;

// this function wraps the handler function to inject the sequelize instance
// and ensure connections are closed after the handler has finished executing
async function attachDb(handler) {
	if (!dbInstance) {
		dbInstance = initKnex({
			client: 'pg',
			connection: process.env.DB_URL,
			pool: {
				min: 1,
				max: 1
			},
			searchPath: "public",
			acquireConnectionTimeout: 3000
		})
	}
	return async function (event, context) {
		context.callbackWaitsForEmptyEventLoop = false;
		context.dbInstance = dbInstance;
		try {
			return await handler(event, context);
		} finally {
			await dbInstance.destroy();
		}
	};
}
module.exports = attachDb;
