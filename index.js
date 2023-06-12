const express = require('express')
const app = express()
const port = process.env.PORT || 4000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middleware
require('dotenv').config()
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// jwt
const jwt = require('jsonwebtoken');
// stripe
const stripe = require("stripe")(process.env.Payment_Secret_Token)


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
// console.log(uri)

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
    const mangeCollection = client.db('sportAcademies').collection("allClasses")
    const cartsCollection = client.db('sportAcademies').collection("carts")
    const paymentCollection = client.db("sportAcademies").collection("payments")



    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' })
      }
      next()
    }

    // const verifyInstructors = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query)
    //   if (user?.role !== 'instructors') {
    //     return res.status(403).send({ error: true, message: 'forbidden message' })
    //   }
    //   next()
    // }



    app.post('/users', async (req, res) => {
      const user = req.body
      console.log(user)
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      console.log('existing user', existingUser)
      if (existingUser) {
        return res.send({ message: 'user already existingUser' })
      }

      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users', verifyJwt, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })



    //   app.get('/users',  async (req, res) => {
    //     const email = req.query.email
    //     console.log(email)
    //     if (!email) {
    //         res.send([])
    //     }
    //     const decodedEmail = req.decoded.email;
    //     if (email !== decodedEmail) {
    //         return res.status(401).send({ error: true, message: 'forbidden access' })
    //     }
    //     const query = { email: email }
    //     const result = await usersCollection.find(query).toArray()
    //     res.send(result)
    // })





    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get('/users/admin/:email', verifyJwt, async (req, res) => {
      const email = req.params.email


      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query)
      const result = { admin: user?.role === 'admin' }
      res.send(result)

    })

    app.patch('/users/instructors/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'instructors'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })



    app.get('/instructorClasses', async (req, res) => {
      const query = { role: 'instructors' }
      const result = await usersCollection.find(query).limit(6).toArray();
      res.send(result)
    })







    app.get('/users/instructors/:email', verifyJwt, async (req, res) => {
      const email = req.params.email
      if (req.decoded.email !== email) {
        res.send({ instructors: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query)
      const result = { instructors: user?.role === 'instructors' }
      res.send(result)

    })
    app.post('/allClasses', async (req, res) => {
      const classesItem = req.body
      const result = await mangeCollection.insertOne(classesItem)
      res.send(result)
    })
    app.get('/allClasses', async (req, res) => {
      const result = await mangeCollection.find().toArray();
      res.send(result)
    })

    app.put('/updatedStatusApproved/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'approved'
        }
      }
      const result = await mangeCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.put('/updatedStatusDeny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'deny'
        }
      }
      const result = await mangeCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.put('/updatedStatusFeedBack/:id', async (req, res) => {
      const id = req.params.id;
      const { feedBack } = req.body;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          feedBack: feedBack
        }
      }
      const result = await mangeCollection.updateOne(filter, updateDoc)
      res.send(result)
    })



    app.get('/approvedClasses', async (req, res) => {
      const query = { status: 'approved' }
      const result = await mangeCollection.find(query).toArray();
      res.send(result)
    })


    // app.get('/classByInstructorEmail', async (req, res) => {
    //   const email = req.query.email
    //   const query = { instructor_email: email }
    //   try {
    //     const result = await mangeCollection.find(query).toArray()
    //     res.send(result)
    //   }
    //   catch(error){
    //     console.error(error)
    //     return res.status(500).json({error:'As error accord while fetching classes by Instructor email'})
    //   }
    // })

    app.get('/allClasses/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await mangeCollection.findOne(query);
      res.send(result)
    })

    app.put('/allClasses/:id', async (req, res) => {
      const id = req.params.id
      console.log(id)
      const filter = { _id: new ObjectId(id) }
      const updatedData = req.body
      console.log(updatedData)
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          seats: updatedData.seats,
          price: updatedData.price,
          details: updatedData.details,
        }
      }
      const result = await mangeCollection.updateOne(filter, updatedDoc, option)
      res.send(result)

    })
    app.post('/carts', async (req, res) => {
      const items = req.body
      console.log(items)
      const result = await cartsCollection.insertOne(items)
      res.send(result)
    })
    // TODO PORE DELETE KORTE HOBE

    // app.get('/carts', async (req, res) => {
    //   const email = req.query.email
    //   if (!email) {
    //     res.send([])

    //   }
    //   const query = { email: email }
    //   const result = await cartsCollection.find(query).toArray()
    //   res.send(result)
    // })

    app.get('/carts', verifyJwt, async (req, res) => {
      const email = req.query.email
      console.log(email)
      if (!email) {
        res.send([])
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(401).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await cartsCollection.find(query).toArray()
      res.send(result)
    })



    app.get('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.findOne(query);
      res.send(result)
    })



    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query)
      res.send(result)
    })




    // jwt 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, { expiresIn: '10h' });
      res.send({ token })
    })




    // payment
    app.post('/create-payment-intent', verifyJwt, async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)
      console.log(price, amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })

    })

    // payment related api
    app.post('/payments', verifyJwt, async (req, res) => {
      const payment = req.body
      payment.date = new Date()
      const id = payment.selectedItemId
      const insertResult = await paymentCollection.insertOne(payment)

      const query = { _id: new ObjectId(id) }
      const deleteResult = await cartsCollection.deleteOne(query)

      res.send({ insertResult, deleteResult })
    })



    app.put('/updatedClass/:id', async (req, res) => {
      const id = req.params.id
      const { seats, enroll } = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {

          seats:seats,
          enroll: enroll
        }
      }
      const result = await mangeCollection.updateOne(filter, updateDoc)
      res.send(result)
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