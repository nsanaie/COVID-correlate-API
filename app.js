const express = require('express');
const app = express();

// middleware for parsing JSON request
// app.use(express.json())
const dataRoute = require('./routes/data')

app.use('/data', dataRoute)

// routes

app.get('/', (req, res) => {
    res.send("api home");
})

// PORT
app.listen(3000);