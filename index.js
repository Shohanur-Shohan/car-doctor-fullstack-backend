const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//config
require("dotenv").config();

//middleware
app.use(
  cors({
    origin: ["https://car-doctor-fullstack.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

////////////my middleware

const logger = async (req, res, next) => {
  // console.log("Logger:", req.hostname, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log("token in verify middleware", token);
  if (!token) {
    res.status(401).send({ message: "User Unauthorized" });
  }
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      // console.log(err);
      res.status(401).send({ message: "Unauthorized" });
    }

    req.decodedUser = decoded;
    // req.user = decoded;
    next();
  });
};

////////////my middleware

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.xqxnoib.mongodb.net`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false,
};

async function run() {
  try {
    // await client.connect();
    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("booked");

    //jwt started
    //post
    app.post("/jwt", async (req, res) => {
      const userEmail = await req?.body;
      const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
        expiresIn: "24h",
      });

      res.cookie("token", token, cookieOption).send({ success: true });
    });

    /////////////////////////////////////////////////////////////

    //get services
    app.get("/services", logger, async (req, res) => {
      // console.log("/services", req.cookies);
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
      // console.log("/booked", req.cookies);
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
    app.get("/booking/:email", logger, async (req, res) => {
      const userEmail = req.params.email;
      // const decodedEmail = req.decodedUser?.email;

      // console.log("user from vefiryToken:", req?.user);
      // console.log("/booking", req.cookies);
      // if (decodedEmail !== userEmail) {
      //   res.status(401).send({ message: "Unauthorized" });
      // }
      const query = { user_email: userEmail };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    //delete user specified booked servie
    app.delete("/delete-booked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      // console.log(id, result);
      res.send(result);
    });

    app.listen(port, () => {
      // console.log(`app is listening, ${port}`);
    });
  } catch (error) {
    // console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}
run();
