const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const {product: validator} = require("./libs/validators");
const rentals = require("./libs/repositories/rentals");

module.exports.getRental = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const dbInstance = context.dbInstance;
  const {rID} = event.pathParameters ?? {};
  const rental = await rentals.get(rID, dbInstance);

  if(!rental){
    return apigHelper.error({
      message: "Rental not found"
    }, 404);
  }
  rental.belongsToUser = rental.value.borrowerId === userId;
  return apigHelper.returnEntity(rental);
});