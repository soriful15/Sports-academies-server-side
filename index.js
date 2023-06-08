const express = require('express')
const app = express()
const port = process.env.PORT || 4000;
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
// middleware
require('dotenv').config()
app.use(cors());
app.use(express.json());

// jwt
const jwt = require('jsonwebtoken');

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  // bearer token
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {

    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded
    next()
  })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.uwuwq9x.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

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

    const usersCollection = client.db('sportAcademies').collection('users')





    app.post('/users', async (req, res) => {
      const user = req.body
      console.log(user)
      const query = { instructor_email: user.email }
      const existingUser = await usersCollection.findOne(query)
      console.log('existing user', existingUser)
      if (existingUser) {
        return res.send({ message: 'user already existingUser' })
      }

      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    // jwt 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, { expiresIn: '10h' });
      res.send({ token })
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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})