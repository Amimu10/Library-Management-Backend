const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion} = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 

// const uri = `mongodb+srv://reader-heaven:<password>@cluster0.8cqq7bd.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cqq7bd.mongodb.net/?retryWrites=true&w=majority`; 

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
 const bookCollection = client.db("reader-heaven").collection("books");  
 
 app.post("/books", async (req, res) => {
    try {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    } catch (error) {
      console.log(error.message);
    }
  });
  
  app.get("/books", async (req, res) => {
    try {
     const cursor = bookCollection.find(); 
      const books = await cursor.toArray(); 
      res.send(books);
    } catch (error) {
      console.error("Error fetching books:", error); 
    }
  });
  

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send(" readers heaven  server is running");
  });
  
  app.listen(port, () => {
    console.log(` readers heaven is running on port: ${port}`);
  });

