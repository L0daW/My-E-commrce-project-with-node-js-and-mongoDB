require('dotenv').config({ path: './config/.env' });
const express = require('express')
const userRouter = require('./routers/user')
const itemRouter =require('./routers/item')
const cartRouter = require('./routers/cart')
const adminRouter = require('./routers/admin');

require('./db/mongoose')

const port = process.env.PORT || 3000; // Default to 3000 if PORT is not defined

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(itemRouter)
app.use(cartRouter)
app.use(adminRouter)


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});