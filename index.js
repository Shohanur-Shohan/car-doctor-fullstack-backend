const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//config
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.xqxnoib.mongodb.net`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // await client.connect();
    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("booked");

    //get services
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //single service
    app.get("/service-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    //book service
    app.post("/booked", async (req, res) => {
      const reqBody = await req?.body;
      const { service_name, service_price, service_date, user_email } =
        reqBody?.formData;
      const doc = {
        service_name: service_name,
        service_price: service_price,
        service_date: service_date,
        user_email: user_email,
        service_details: reqBody?.serviceDetails,
      };
      // console.log(doc);
      const result = await bookingCollection.insertOne(doc);
      res.send(result);
    });

    //get user specific booking service
    app.get("/booking/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { user_email: userEmail };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.listen(port, () => {
      console.log(`app is listening, ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}
run();
