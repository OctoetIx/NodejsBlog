require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const methodOverride= require('method-override');
const MongoStore = require('connect-mongo');
const session = require('express-session');

const connectDB = require('./server/config/db');




const app = express();
const PORT = 2000 || process.env.PORT;

// connect to DB

connectDB();

app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
   secret:'keyboard cat',
   resave: false,
   saveUninitialized: true,
   store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
   }),
   // cookie: {maxAge: new Date( Date.now() + (300000))}

}));


// Template Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout','./layouts/main');


app.use('/', require('./server/routes/main'))
app.use('/', require('./server/routes/admin'))

 app.listen(PORT,()=>{
    console.log(`App listening on ${PORT}`)
 });

