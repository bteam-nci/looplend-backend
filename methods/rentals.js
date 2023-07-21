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
  rental.value.belongsToUser = rental.value.borrowerId === userId;
  return apigHelper.returnEntity(rental);
});

module.exports.listRentals = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const {page,status} = event.queryStringParameters ?? {};
  const dbInstance = context.dbInstance;

  const [list, total] = await rentals.list(userId, {page, status}, dbInstance);

  return apigHelper.returnList(list, page, total);
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
  rental.value.belongsToUser = rental.value.borrowerId === userId;
  if(rental.value.belongsToUser && rental.value.product.borrowerId !== userId){
    return apigHelper.error({
      message: "This user can not accept this rental request"
    }, 403);
  }

  const [collidingAvailabilities, collidingRentals] = await Promise.all([
    dbInstance("products_availabilities").where("productId", rental.value.productId).andWhere(dbInstance.raw("daterange(?, ?) && daterange(start, end)", [rental.value.start, rental.value.end])),
    dbInstance("rentals").where("productId", rental.value.productId).andWhere("status", 1).andWhere(dbInstance.raw("daterange(?, ?) && daterange(start, end)", [rental.value.start, rental.value.end]))
  ]);
  if (collidingAvailabilities.length > 0 || collidingRentals.length > 0) {
    return apigHelper.badRequest({
      "message": "Rental collides with other rentals or availabilities"
    });
  }

  if(rental.value.status !== "PENDING"){
    return apigHelper.error({
      message: "Rental is not pending"
    }, 400);
  }

  await rentals.accept(rID, dbInstance);

  return apigHelper.returnEntity({value:{}});
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
  rental.value.belongsToUser = rental.value.borrowerId === userId;

  if(rental.value.belongsToUser && rental.value.product.borrowerId !== userId){
    return apigHelper.error({
      message: "This user can not accept this rental request"
    }, 403);
  }

  if(rental.value.status !== "PENDING"){
    return apigHelper.error({
      message: "Rental is not pending"
    }, 400);
  }

  await rentals.deny(rID, dbInstance);

  return apigHelper.returnEntity({value:{}});
});

module.exports.createRental = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const dbInstance = context.dbInstance;

  const rentalInput = JSON.parse(event.body ?? "{}");

  if (!validator(rentalInput)) {
    return apigHelper.badRequest({
      "message": "Invalid rental"
    });
  }
  if (new Date(rentalInput.start) > new Date(rentalInput.end)) {
    return apigHelper.badRequest({
      "message": "Invalid rental dates"
    });
  }
  if (new Date(rentalInput.start) < new Date()) {
    return apigHelper.badRequest({
      "message": "Start date must be in the future"
    });
  }

  const product = await products.get(rentalInput.productId, dbInstance);

  if(!product){
    return apigHelper.error({
      message: "Product not found"
    }, 404);
  }

  if(product.value.ownerId === userId) {
    return apigHelper.error({
      message: "Cannot rent your own product"
    }, 403);
  }

  // check if the rentals collide with the availabilities and if the rentals collide with other rentals
  const [collidingAvailabilities, collidingRentals] = await Promise.all([
    dbInstance("products_availabilities").where("productId", rentalInput.productId).andWhere(dbInstance.raw("daterange(?, ?) && daterange(start, end)", [rentalInput.start, rentalInput.end])),
    dbInstance("rentals").where("productId", rentalInput.productId).andWhere("status", 1).andWhere(dbInstance.raw("daterange(?, ?) && daterange(start, end)", [rentalInput.start, rentalInput.end]))
  ]);
  if (collidingAvailabilities.length > 0 || collidingRentals.length > 0) {
    return apigHelper.badRequest({
      "message": "Rental collides with other rentals or availabilities"
    });
  }

  // calculate the price by multiplying the price of the product by difference between the start and end date
  const price = product.value.price * ((new Date(rentalInput.end) - new Date(rentalInput.start)) / (1000 * 60 * 60 * 24));
  // create base rental
  const baseRental = {
    ...rentalInput,
    total: price,
    borrowerId: userId
  }

  const rental = await rentals.create(baseRental, dbInstance);

  return apigHelper.returnEntity(rental);
});
