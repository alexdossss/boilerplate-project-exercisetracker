const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
})

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users', async (req, res) => {
  const user = new User({ username: req.body.username })
  await user.save()
  res.json({ username: user.username, _id: user._id })
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '_id username')
  res.json(users)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const user = await User.findById(req.params._id)
  if (!user) return res.json({ error: 'User not found' })

  const exerciseDate = date ? new Date(date) : new Date()
  const exercise = new Exercise({
    userId: user._id,
    description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString()
  })
  await exercise.save()

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const user = await User.findById(req.params._id)
  if (!user) return res.json({ error: 'User not found' })

  let exercises = await Exercise.find({ userId: user._id })

  if (from) {
    const fromDate = new Date(from)
    exercises = exercises.filter(e => new Date(e.date) >= fromDate)
  }
  if (to) {
    const toDate = new Date(to)
    exercises = exercises.filter(e => new Date(e.date) <= toDate)
  }
  if (limit) {
    exercises = exercises.slice(0, parseInt(limit))
  }

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
