const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const UserModel = require('./models/Users')
const app = express();
const port = 5000;

app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(cookieParser());
const mongodbAtlasUri = `mongodb+srv://${process.env.VITE_DB_USER}:${process.env.VITE_DB_PASSWORD}@cluster0.10dhryt.mongodb.net/socialMediaDB?retryWrites=true&w=majority`
mongoose
    .connect(mongodbAtlasUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('Database connection with mongoose successful!') })
    .catch((error) => { console.log('Database connection failed', error) })

app.get('/', async (req, res) => {
    res.send('Server is running')
})

app.get('/profile', (req, res) =>{
    const {token} = req.cookies;
    if(token){
        jwt.verify(token, process.env.VITE_SECRET_KEY, {}, (err, user)=>{
            if(err){
                throw err;
            }
            res.json(user);
        })
        
    }
    else{
        res.json(null)
    }
})
app.post('/login', (req, res) => {
    const { name, password } = req.body;
    UserModel.findOne({ name: name })
        .then(user => {

            if (user) {
                bcrypt.compare(password, user.password, (error, response) => {
                   
                    if (response) {
                        const token = jwt.sign({name: user.name, email: user.email}, process.env.VITE_SECRET_KEY, { expiresIn: '1d'})
                        res.cookie('token', token, {httpOnly: true})
                        res.json('Success')
                    }
                    else{
                        res.json('Password is incorrect')
                    }
                })

                

            }
            else {
                res.json('User doesn\'t exist')
            }

        })
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    // Hash the password upon receiving it in the request body
    bcrypt.hash(password, 10)
        .then(hash => {
            UserModel.create({ email, name, password: hash })
                .then(users => res.json(users))
                .catch(error => res.json(error))
        })
        .catch(error => console.log(error.message))
})

app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
})
