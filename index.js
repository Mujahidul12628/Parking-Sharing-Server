const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz-lts')


const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}
@cluster0.xuczi3d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false //true for live, false for sandbox
console.log(store_id, store_passwd)
async function run() {
    try {

        const parkingCollection = client.db('parkingDB').collection('parking');

        app.get('/parking', async (req, res) => {
            const cursor = parkingCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // app.post('/parking', async (req, res) => {
        //     const newparking = req.body;
        //     console.log(newparking);
        //     const result = await parkingCollection.insertOne(newparking);
        //     res.send(result);
        // })

        // const transaction_ID = new ObjectId().toString();
        const transaction_ID = new ObjectId().toString();

        app.post('/parking', async (req, res) => {

            const id = req.body.id;
            const parking = await parkingCollection.findOne({
                _id: new ObjectId(id)
            });
            console.log('Payment ID from request:', req.body.id);
            console.log(parking); //console the data which are relate to id


            const parkingInformation = req.body;
            console.log(parkingInformation); //console the form data of user



            const data = {
                total_amount: parking?.rates,
                currency: parkingInformation.currency,
                tran_id: transaction_ID, // use unique tran_id for each api call
                success_url: `http://localhost:5000/payment/success/${transaction_ID}`,
                fail_url: `http://localhost:5000/payment/failed/${transaction_ID}`,
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: parkingInformation.name,
                cus_email: 'customer@example.com',
                cus_add1: parkingInformation.address,
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            console.log(data)
            // const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            // sslcz.init(data).then(apiResponse => {
            //     // Redirect the user to payment gateway
            //     let GatewayPageURL = apiResponse.GatewayPageURL
            //     // res.redirect(GatewayPageURL)
            //     res.send({ url: GatewayPageURL })
            //     console.log('Redirecting to: ', GatewayPageURL)
            // });



        })

        // Payment Success Item
        app.post('/payment/success/:transaction_ID', async (req, res) => {
            console.log(req.params.transaction_ID);
            const result = await parkingCollection.updateOne(
                { transactionId: req.params.transaction_ID },
                {
                    $set: {
                        paidStatus: true,
                    },
                }
            );
            if (result.modifiedCount > 0) {
                res.redirect(`http://localhost:5173/payment/success/${req.params.transaction_ID}`)

            }
            else {
                res.status(404).json({ error: 'Document not found or not updated' });
            }
        });

        //Payment Failed Item
        app.post('/payment/failed/:transaction_ID', async (req, res) => {
            console.log(req.params.transaction_ID);
            const result = await parkingCollection.deleteOne(
                { transactionId: req.params.transaction_ID },
                // {
                //     $set: {
                //         paidStatus: false,
                //     },
                // }
            );
            if (result.deletedCount) {
                res.redirect(`http://localhost:5173/payment/failed/${req.params.transaction_ID}`)

            }
            else {
                res.status(404).json({ error: 'Document not found or not updated' });
            }
        });

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
    res.send('Parking Sharing Server is Running');
})

app.listen(port, () => {
    console.log(`Parking Sharing Server run on port ${port}`);
})
