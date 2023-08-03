const attachDb = require("./libs/db");
const apigHelper = require("./libs/apigHelper");
const {rental: validator, feedback: feedbackValidator} = require("./libs/validators");
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
    dbInstance("products_availability").where("productId", rental.value.productId).where("products_availability.productId", rental.value.productId).andWhere(
      (qB) => qB
        .whereBetween("start", [rental.value.start, rental.value.end])
        .orWhereBetween("end", [rental.value.start, rental.value.end])
    ),
    dbInstance("rentals").where("productId", rental.value.productId).andWhere("status", 1).where("rentals.productId", rental.value.productId)
      .andWhere("rentals.status", 1).andWhere(
      (qB) => qB
        .whereBetween("start", [rental.value.start, rental.value.end])
        .orWhereBetween("end", [rental.value.start, rental.value.end])
    )
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

  const product = await products.get({productId: rentalInput.productId}, dbInstance);

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
    dbInstance("products_availability").where("productId", rentalInput.productId).where("products_availability.productId", product.value.id).andWhere(
      (qB) => qB
        .whereBetween("start", [rentalInput.start, rentalInput.end])
        .orWhereBetween("end", [rentalInput.start, rentalInput.end])
    ),
    dbInstance("rentals").where("productId", rentalInput.productId).andWhere("status", 1).where("rentals.productId", product.value.id)
      .andWhere("rentals.status", 1).andWhere(
      (qB) => qB
        .whereBetween("start", [rentalInput.start, rentalInput.end])
        .orWhereBetween("end", [rentalInput.start, rentalInput.end])
    )
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

module.exports.sendProductFeedback = attachDb(async (event, context) => {
  const userId = apigHelper.getUserId(event);
  const {rID} = event.pathParameters ?? {};
  const dbInstance = context.dbInstance;

  const feedbackInput = JSON.parse(event.body ?? "{}");

  if (!feedbackValidator(feedbackInput)) {
    return apigHelper.badRequest({
      "message": "Invalid feedback"
    });
  }
  let rental = await rentals.get(rID, dbInstance);
  if (!rental) {
    return apigHelper.error({
      message: "Rental not found"
    }, 404);
  }
  if (rental.value.status !== "COMPLETED") {
    return apigHelper.error({
      message: "Rental is not completed"
    }, 400);
  }
  if (rental.value.product.borrowerId !== userId) {
    return apigHelper.error({
      message: "User is not the borrower"
    }, 403);
  }

  const feedback = await rentals.sendProductFeedback({
    ...feedbackInput,
    productId: rental.value.product.id,
    rentalId: rID,
    reviewerId: userId
  }, dbInstance);
  if (!feedback) {
    return apigHelper.error({
      message: "Feedback already sent"
    }, 400);
  }
  rental = await rentals.get(rID, dbInstance);

  return apigHelper.returnEntity(rental);
});
