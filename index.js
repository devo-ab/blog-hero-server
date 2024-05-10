const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware start

app.use(cors());
app.use(express.json());

// middleware end



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfuxqes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // collection start
    const blogsCollection = client.db("blogsDB").collection("blogs");
    // collection end

    app.post('/addblogs', async(req, res) => {
      const blogs = req.body;
      // console.log(blogs);
      const result = await blogsCollection.insertOne(blogs);
      res.send(result);
    });

    app.get('/blogs', async(req, res) => {
      const cursor = blogsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = {_id : new ObjectId(id)};
      const result = await blogsCollection.findOne(query);
      res.send(result)
    });

    app.put('/blogsUpdate/:id', async(req, res) => {
      const id = req.params.id;
      const filter= {_id: new ObjectId(id)};
      const options = { upsert: true};
      const updatedBlog = req.body;
      console.log(updatedBlog)

      const blog = {
        $set : {
          title: updatedBlog.title,
          category: updatedBlog.category,
          imageUrl : updatedBlog.imageUrl,
          shortDes : updatedBlog.shortDes,
          longDes: updatedBlog.longDes,
        }
      }
      const result = await blogsCollection.updateOne(filter, blog, options);
      res.send(result);
    });





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
    res.send("Blog Hero Is Running In His Way")
});

app.listen(port, () => {
    console.log(`Blog Hero Is Running On Port : ${port}`)
});