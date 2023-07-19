// script to fill database with mock data
const {faker} = require('@faker-js/faker');
const knex = require('knex')({
	client: 'pg',
	connection: "postgres://postgres:4ekMUWTslnTYx1Gj@db.niypwhwjzcgmatcvcxdi.supabase.co:6543/postgres"
});

(async () => {
	await knex("products").del();

	const products = [];
	// generate 50 products randomly assigned to users
	for (let i = 0; i < 75; i++){
		products.push({
			name: faker.commerce.productName(),
			// ownerId: users[Math.floor(Math.random() * users.length)].id,
			price: faker.commerce.price({
				min: 100,
				max: 100000,
				dec: 0
			}),
			description: faker.commerce.productDescription(),
			category: faker.helpers.rangeToNumber({ min: 1, max: 7 }),
			image: faker.image.url(),
			ownerId: "user_2SOuyhSDQBI51xg3hI2ZrngvexW"
		});
	}

	// insert into the database
	await knex("products").insert(products);

})();
