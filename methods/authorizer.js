const { Clerk } = require("@clerk/clerk-sdk-node");
const clerk = new Clerk("sk_test_eHoAwq1CmgbMp2BmxGDpmaCK4u9QRm8U4vXlKqHXKK");

// Authorizer function
module.exports.handler = async (event) => {
	try {
		// Get the JWT token from the Authorization header
		const token = event.headers.Authorization;

		// Verify the token using Clerk SDK
		const { sessionId, userId } = await clerk.verifyJwt(token);

		// Return the policy document for API Gateway to allow access
		return generatePolicy(userId, "Allow", event.methodArn, { userId });
	} catch (error) {
		// Return the policy document for API Gateway to deny access
		return generatePolicy(null, "Deny", event.methodArn);
	}
};

// Helper function to generate the IAM policy document
function generatePolicy(principalId, effect, resource, context) {
	const policyDocument = {
		Version: "2012-10-17",
		Statement: [
			{
				Action: "execute-api:Invoke",
				Effect: effect,
				Resource: resource,
			},
		],
	};

	return {
		principalId,
		policyDocument,
		context,
	};
}
