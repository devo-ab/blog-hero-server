const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


// middleware start

app.use(cors());
app.use(express.json());

// middleware end


app.get('/', (req, res) => {
    res.send("Blog Hero Is Running In His Way")
});

app.listen(port, () => {
    console.log(`Blog Hero IS Running On Port : ${port}`)
});