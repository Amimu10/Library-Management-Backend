const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId, } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 

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
    // await client.connect();
    // Send a ping to confirm a successful connection
 const bookCollection = client.db("reader-heaven").collection("books");  
 const bookingCollection = client.db("reader-heaven").collection("bookings");   
 
 app.post("/books", async (req, res) => {
    try {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    } catch (error) {
      console.log(error.message);
    }
  }); 
  
  app.get("/books/:id", async (req, res) => { 
    try{
        const id = req.params.id;  
        const query = {
          _id: new ObjectId(id)    
    
        };  
        const result = await bookCollection.findOne(query); 
        console.log(result); 
        res.send(result);
    }catch(error){
        console.log(error.message); 
    }
  }); 

  app.get("/books", async (req, res) => {
    const cursor = bookCollection.find();
    const result = await cursor.toArray();
    res.send(result);  
  });  


  app.get("/bookscategory/:category", async (req, res) => { 
    const category = req.params.category; 
   const query = {  
       category: category 
   }
    console.log(category);     
    const cursor = bookCollection.find(query);
    const result = await cursor.toArray(); 
    res.send(result);   
  });

  app.put("/books/:id", async (req, res) => { 
    const id = req.params.id; 
    const fliter = { _id: new ObjectId(id) }; 
    const options = { upsert: true }; 
    const updatedBook = req.body; 
    const book = {
      $set: {
        image: updatedBook.image, 
        name: updatedBook.name, 
        quantity: updatedBook.quantity,  
        category: updatedBook.category, 
        author: updatedBook.author, 
        rating: updatedBook.rating, 
        description: updatedBook.description,
        read: updatedBook.read
      }, 
    };
    const result = await bookCollection.updateOne(fliter, book, options);
    res.send(result);
  });

  app.get("/bookDetails/:id", async (req, res) => {
    const id = req.params.id;  
    const query = {
      _id: new ObjectId(id) 
,
    };
    const result = await bookCollection.findOne(query); 
    console.log(result);
    res.send(result); 
  });

  
  app.post("/bookings", async (req, res) => {
    const booking = req.body;  
    console.log(booking);
    const result = await bookingCollection.insertOne(booking); 
    res.send(result);
  }); 

//   app.get("/borrowBook/:id", async (req, res) => { 
//     const id = req.params.id;   
//     const query = {
//       _id: new ObjectId(id) 
// ,
//     };
//     const result = await bookCollection.findOne(query); 
//     console.log(result);
//     res.send(result); 
//   }); 

  app.get("/readBook/:id", async (req, res) => {
    const id = req.params.id;  
    const query = {
      _id: new ObjectId(id) 
,
    };
    const result = await bookCollection.findOne(query); 
    console.log(result);
    res.send(result);
  });


    await client.db("admin").command({ ping: 1 });
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

