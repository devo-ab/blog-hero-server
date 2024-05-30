const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware start

app.use(cors({
  origin: [
    'http://localhost:5173', 'https://blog-hero-c02f7.web.app', 'https://blog-hero-c02f7.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// middleware end

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfuxqes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// jwt middleware start

const logger = (req, res, next) => {
  // console.log("log info :",req.method, req.url)
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token)
  if(!token){
    return res.status(401).send({message : 'Token Nai'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if(err){
      return res.status(401).send({message : 'Unauthorized Access'})
    }
    req.user = decoded;
    next();
  })
};

// jwt middleware start

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false 
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // collection start
    const blogsCollection = client.db("blogsDB").collection("blogs");
    const commentCollection = client.db("blogsDB").collection("comment");
    const wishlistCollection = client.db("blogsDB").collection("wishlist");
    // collection end


    // jwt start

    app.post("/jwt", logger, async(req, res) => {
      const user = req.body;
      console.log("user for token",user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn : '1h'})
      res.cookie('token', token, cookieOption)
      .send({success : true})
    });

    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log("logout", user);
      res.clearCookie('token', {...cookieOption, maxAge: 0}).send({success : true})
    });

    // jwt end

    app.post("/addblogs", async (req, res) => {
      const blogs = req.body;
      console.log("token owner info",req.user)
      // console.log('from client', req.body.email)
      // const clientEmail = req.body.email;
      // console.log('from client', clientEmail)
      // if(req.user.email !== clientEmail){
      //   return res.status(403).send({message : "Forbidden Access"})
      // }
      const result = await blogsCollection.insertOne(blogs);
      // console.log(blogs.email);
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const cursor = blogsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/popular", async (req, res) => {
      const cursor = blogsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // search start

    app.get("/search/title/:text", async (req, res) => {
      const searchTitle = req.params.text;
      // console.log(searchTitle);
      const query = {};
      if (searchTitle) {
        query.title = { $regex: searchTitle, $options: "i" };
      }
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/search/:category", async (req, res) => {
      const searchCategory = req.params.category;
      // console.log(searchCategory);
      const result = await blogsCollection.find({ category: searchCategory }).toArray();
      res.send(result);
    });

    // search end

    app.get("/recent", async (req, res) => {
      const recentBlogs = blogsCollection.find().sort({ blog_time: -1, blog_date: -1 }).limit(6);
      const result = await recentBlogs.toArray();
      res.send(result);
    });


    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    app.put("/blogsUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlog = req.body;
      // console.log(updatedBlog);

      const blog = {
        $set: {
          title: updatedBlog.title,
          category: updatedBlog.category,
          imageUrl: updatedBlog.imageUrl,
          shortDes: updatedBlog.shortDes,
          longDes: updatedBlog.longDes,
        },
      };
      const result = await blogsCollection.updateOne(filter, blog, options);
      res.send(result);
    });

    app.post("/comments", async (req, res) => {
      const comment = req.body;
      // console.log(comment);
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    app.get("/comments/:id", async (req, res) => {
      const blogId = req.params.id;
      // console.log(id)
      const query = { blogs_id: blogId };
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/comments/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await commentCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const wishlist = req.body;
      // console.log(wishlist);
      const result = await wishlistCollection.insertOne(wishlist);
      res.send(result);
    });

    app.get("/wishlist/:email", logger, verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log("token owner info",req.user)
      if(req.user.email !== req.params.email){
        return res.status(403).send({message : "Forbidden Access"})
      }
      // console.log(email);
      const query = { userEmail: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/featured", async (req, res) => {
      const result = await blogsCollection.find().limit(10).toArray();
      result.sort((a, b) => {
        const wordCountA = a.longDes.trim().split(/\s+/).length;
        const wordCountB = b.longDes.trim().split(/\s+/).length;
        return wordCountB - wordCountA;
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blog Hero Is Running In His Way");
});

app.listen(port, () => {
  console.log(`Blog Hero Is Running On Port : ${port}`);
});
