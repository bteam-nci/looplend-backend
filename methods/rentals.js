const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const {rental: validator} = require("./libs/validators");
const rentals = require("./libs/repositories/rentals");
const products = require("./libs/repositories/products");

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

module.exports.listRentals = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const {page} = event.queryStringParameters ?? {};
  const dbInstance = context.dbInstance;

  const [rentals, total] = await rentals.list(userId, {page}, dbInstance);

  return apigHelper.returnList(rental, page, total);
});

module.exports.acceptRental = attachDb(async (event, context) => {
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

  if(!rental.belongsToUser){
    return apigHelper.error({
      message: "Rental does not belong to user"
    }, 403);
  }

  if(rental.value.status !== 0){
    return apigHelper.error({
      message: "Rental is not pending"
    }, 403);
  }

  await rentals.accept(rID, dbInstance);

  return apigHelper.returnEntity(rental);
});

module.exports.denyRental = attachDb(async (event, context) => {
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

  if(!rental.belongsToUser){
    return apigHelper.error({
      message: "Rental does not belong to user"
    }, 403);
  }

  if(rental.value.status !== 0){
    return apigHelper.error({
      message: "Rental is not pending"
    }, 403);
  }

  await rentals.deny(rID, dbInstance);

  return apigHelper.returnEntity(rental);
});

module.exports.createRental = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const dbInstance = context.dbInstance;

  const rentalInput = JSON.parse(event.body ?? "{}");

  if (!validator(rentalInput)) {
    return apigHelper.badRequest({
      "message": "Invalid Rental"
    });
  }

  const {product} = await products.get(rentalInput.productId, dbInstance);

  if(!product){
    return apigHelper.error({
      message: "Product not found"
    }, 404);
  }

  if(product.ownerId === userId) {
    return apigHelper.error({
      message: "Cannot rent your own product"
    }, 403);
  }
  // calculate the price by multiplying the price of the product by difference between the start and end date
  const price = product.price * (new Date(rentalInput.endDate) - new Date(rentalInput.startDate)) / (1000 * 60 * 60 * 24);
  // create base rental
  const baseRental = {
    ...rentalInput,
    total: price,
    borrowerId: userId
  }

  const rental = await rentals.create(baseRental, dbInstance);

  return apigHelper.returnEntity(rental);
});
