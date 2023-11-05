const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5111;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xuczi3d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const parkingCollection = client.db('parkingDB').collection('parking');

        app.get('/parking', async (req, res) => {
            const cursor = parkingCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/parking', async (req, res) => {
            const newparking = req.body;
            console.log(newparking);
            const result = await parkingCollection.insertOne(newparking);
            res.send(result);
        })

        app.delete('/parking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parkingCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/parking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parkingCollection.findOne(query);
            res.send(result);
        })

        app.put('/parking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedparking = req.body;

            const parking = {
                $set: {
                    name: updatedparking.name,
                    location: updatedparking.location,
                }
            }

            const result = await parkingCollection.updateOne(filter, parking, options);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('decabo Server is Running');
})

app.listen(port, () => {
    console.log(`decabo Server run on port ${port}`);
})
