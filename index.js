const express = require('express');
const cors = require('cors');
require('dotenv').config();
const SSLCommerzPayment = require('sslcommerz-lts')

const app = express();
const port = process.env.PORT || 5008;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xuczi3d.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const store_id = process.env.SSL_Store_id;
const store_passwd = process.env.SSL_Store_pass;
const is_live = false //true for live, false for sandbox

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

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


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('parking making server is running')
})

app.listen(port, () => {
    console.log(`parking Server is running on port: ${port}`)
})