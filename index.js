const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");  
const cookieParser = require('cookie-parser'); 

const { MongoClient, ServerApiVersion, ObjectId, } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ 
    origin: ["http://localhost:5173"],  
    credentials : true 
}));

app.use(express.json()); 
app.use(cookieParser()); 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cqq7bd.mongodb.net/?retryWrites=true&w=majority`; 

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { 
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger = (req, res, next) => {
    console.log("log info", req.method, req.url); 
    next(); 
}


async function run() { 
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
 const bookCollection = client.db("reader-heaven").collection("books");  
 const bookingCollection = client.db("reader-heaven").collection("bookings");   

app.post("/jwt", logger,  async (req, res) => { 
     const user = req.body; 
     console.log("user token", user); 

     const token = jwt.sign(user, process.env.SECRET_TOKEN, {expiresIn: "1h"}); 
     res
     .cookie('token', token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
     })
     .send({ success: true }) 
} )

const verifyToken = (req, res, next) => { 
  const token = req?.cookies?.token; 
  if(!token){
    return res.status(401).send({message: "unauthorized access"}) 
  }
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => { 
      if(err){
        return res.status(401).send({message: "unauthorized access"}) 
      }
      req.user = decoded; 
      next();
  })
}

app.post("/logout", async (req, res) => {
   const user = req.body;
   console.log("logging out", user); 
   res.clearCookie("token", {maxAge: 0}).send({success: true});
})
 
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

  app.post("/bookings", async (req, res) => {
    try {
      const { name, return_date, borrowed_date, email, bookId, quantity } = req.body;
  
      // Fetch only the necessary book details from the database based on bookId
      const book = await bookCollection.findOne({ _id: new ObjectId(bookId) });
      console.log("book", book);
      if (!book) {
        return res.status(404).send({ message: "Book not found" });
      }
      const update = {
        $set: {
          quantity : parseInt(quantity) - 1
        }
     }
     const updateQuantity = await bookCollection.updateOne({ _id: new ObjectId(bookId) }, update); 
     console.log("updated", updateQuantity); 
      const booking = {
        customerName: name,
        email,
        Retuen_Date: return_date,
        borrowed_date,
        book: {
          _id: book._id,
          name: book.name,
          image: book.image,
          category: book.category,
        },
      };

      // Save booking data to the database
      const result = await bookingCollection.insertOne(booking);
  
      res.send(result);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

app.delete("/bookings/:id", async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await bookingCollection.deleteOne(query); 
    res.send(result); 
})
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


  // app.post("/bookings",   async (req, res) => {
  //   const booking = req.body;  
  //   console.log(booking);
  //   const result = await bookingCollection.insertOne(booking); 
  //   res.send(result); 
  // });  

  
  
  app.get("/bookingData", verifyToken, async (req, res) => {        
    console.log("token", req.cookies.token);  
    console.log("token owner info", req?.user);  

    if(req.user?.email !== req.query?.email){ 
      return res.status(403).send({message: "unauthorized access"})   
     }

     let query = {};
      if (req.query?.email) { 
        query = { email: req.query.email }; 
      }

    const result = await bookingCollection.find(query).toArray();  
    res.send(result);
  });  



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

