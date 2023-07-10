const initKnex = require('knex');
let dbInstance = null;

// this function wraps the handler function to inject the sequelize instance
// and ensure connections are closed after the handler has finished executing
/*
 * @param {function} handler - the handler function to wrap
 */
function attachDb(handler) {
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
	return async (event, context, callback) => {
		context.callbackWaitsForEmptyEventLoop = false;
		context.dbInstance = dbInstance;
		try {
			const results = await handler(event, context);
			callback(null, results);
		} catch (error) {
			callback(error);
		}finally {
			dbInstance.destroy();
		}
	};
}
module.exports = attachDb;
