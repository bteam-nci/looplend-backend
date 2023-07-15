const { Clerk } = require("@clerk/clerk-sdk-node");
const clerk = new Clerk({
	jwtKey:`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxnzcJd0gY2gW8E5ayHcA
fzqOTiJaaiz0RCdVd+RbkcN7Ms+GPc6yAxvcR9tURJVwj2LCQUQ+E4AvuPrfkwLf
/CqrMQUGQlZkVmGmxc7ewu91aO44vCGNzPAUJSPPL9kbG02mi9ZZ4DKjiea8eJcu
GP3civMGV1OB/kSlbNURG8tyPp8/9CksE4Tm/FSijfvJp5wQFRNH4XgRT5/sZRMZ
L0EpMUnTwz7FOW1zN65ONpGSJALpdwrKIMf9FqsV/UfmllEISvfSHy9xEI5iEt/f
Ol+XNKaMzjKs7iEnXzFS7Hp6eMUrRk2iyFk/vYMkj+Ms+sc9PaXhLpqyOAjBOvqy
jwIDAQAB
-----END PUBLIC KEY-----`
});

const passthroughEndpoints = [
	"/GET/products",
]
// Authorizer function
module.exports.handler = async (event) => {
	try {
		// Get the JWT token from the Authorization header
		const token = event.authorizationToken;

		// Verify the token using Clerk SDK
		const {sub} = await clerk.verifyToken(token);
		// Return the policy document for API Gateway to allow access
		return generatePolicy(sub, "Allow", event.methodArn, { userId:sub });
	} catch (error) {
		if (passthroughEndpoints.some(e=> event.methodArn.endsWith(e))){
			return generatePolicy(null, "Allow", event.methodArn);
		}
		console.error(error);
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
