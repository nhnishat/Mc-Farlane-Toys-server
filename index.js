const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4pio7r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
	try {
		await client.connect();
		const carsCollection = client.db('toyCarsDB').collection('cars');

		const indexKey = { name: 1 };
		const indexOptions = { name: 'names' };
		const result = await carsCollection.createIndex(indexKey, indexOptions);

		app.get('/car', async (req, res) => {
			const page = parseInt(req.query.page) || 1;
			const limit = 20;
			const skip = (page - 1) * limit;

			const totalCount = await carsCollection.countDocuments();
			const totalPages = Math.ceil(totalCount / limit);

			const result = await carsCollection
				.find()
				.skip(skip)
				.limit(limit)
				.sort({ price: 1 })
				.toArray();

			const formattedResult = result.map((car) => ({
				...car,
				price: parseFloat(car.price),
			}));

			res.send({
				data: formattedResult,
				page: page,
				totalPages: totalPages,
			});
		});

		app.get('/sportsCar', async (req, res) => {
			const query = { subCategory: 'sports car' };
			const result = await carsCollection.find(query).toArray();
			res.send(result);
		});
		app.get('/car/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await carsCollection.findOne(query);
			res.send(result);
		});

		app.get('/policeCar', async (req, res) => {
			const query = { subCategory: 'police car' };
			const result = await carsCollection.find(query).toArray();
			res.send(result);
		});
		app.get('/miniFireTruck', async (req, res) => {
			const query = { subCategory: 'firetruck car' };
			const result = await carsCollection.find(query).toArray();
			res.send(result);
		});

		app.get('/searchCar/:name', async (req, res) => {
			const nameSearch = req.params.name;
			const regex = new RegExp(nameSearch, 'i');
			const result = await carsCollection
				.find({
					name: { $regex: regex },
				})
				.toArray();
			console.log(result);
			res.send(result);
		});

		app.get('/myToy/:email', async (req, res) => {
			const result = await carsCollection
				.find({ sellerEmail: req.params.email })
				.toArray();
			res.send(result);
		});

		app.post('/allCars', async (req, res) => {
			const newCars = req.body;
			const result = await carsCollection.insertOne(newCars);
			res.send(result);
		});

		app.patch('/car/:id', async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updatedCar = req.body;
			const option = { upsert: true };
			const car = {
				$set: {
					name: updatedCar.name,
					sellerName: updatedCar.sellerName,
					sellerEmail: updatedCar.sellerEmail,
					subCategory: updatedCar.subCategory,
					price: updatedCar.price,
					rating: updatedCar.rating,
					quantity: updatedCar.quantity,
					description: updatedCar.description,
				},
			};
			const result = await carsCollection.updateOne(filter, car, option);
			// console.log(result);
			res.send(result);
		});
		app.delete('/car/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await carsCollection.deleteOne(query);
			console.log(result);
			res.send(result);
		});

		await client.db('admin').command({ ping: 1 });
		console.log('Connected to MongoDB!');
	} finally {
		// await client.close();
	}
}

run().catch(console.error);

app.get('/', (req, res) => {
	res.send('Toy cars is running...');
});

app.listen(port, () => {
	console.log(`Toy car running on port: ${port}`);
});
