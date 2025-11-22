const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Check Login
const authMiddleware = ( req, res, next) =>{
        const token = req.cookies.token;
        if(!token){
                return res.status(401).json({message: "unauthorized"});
        }
        try {
                const decoded = jwt.verify(token, jwtSecret);
                req.userId = decoded.userId;
                next();
        } catch (error) {
                return res.status(401).json({message: "unauthorized"});
        }
}

//Routes
// GET 
// HOME ADMIN-LOGIN PAGE
router.get('/admin', async(req, res) => {

        try {
                const locals ={
                        title:"Admin",
                        description: "Simple Blog Created with NodeJs, Express & MongoDb"
                }
                res.render('admin/index', 
                {locals, layout: adminLayout}); 
                
        } catch (error) {
                console.log(error);
        }   
});
// ADMIN DASHBOARD
router.get('/dashboard', authMiddleware, async(req, res) => {

        try { 
                const locals ={
                        title: 'Dashboard',
                        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
                }
                const data = await Post.find();
              
                
                let perPage = 4;
                let page = req.query.page || 1;

                const dat = await Post.aggregate([{$sort: {cratedAt: -1}}])
                .skip(perPage * page - perPage)
                .limit(perPage)
                .exec();

                const count = await Post.countDocuments();
                const nextPage = parseInt(page) + 1;

                const hasNextPage = nextPage <= Math.ceil(count / perPage)
                res.render('admin/dashboard',{locals, data, dat, layout:adminLayout,   current: page,
                        nextPage: hasNextPage ? nextPage :null});
              
                
        } catch (error) {
                
        }
});
// GET ADD-POST
router.get('/add-post',authMiddleware, async(req, res) => {
        try {
                const locals ={
                        title:'Add post',
                        description: 'Created with NodeJs, Express and MongoDB'
                }
                const data = await Post.find();

                res.render('admin/add-post',{data})
        } catch (error) {
                
        }
       
});
// GET ROUTE EDIT DATA
router.get('/edit-post/:id',authMiddleware, async(req, res) => {
        try {
                const locals ={
                        title:'Edit post',
                        description: 'Created with NodeJs, Express and MongoDB'
                };
             const data = await Post.findOne({_id: req.params.id});

                res.render('admin/edit-post', {
                        locals,
                        data,
                        layout: adminLayout
                });
        } catch (error) {
               console.log(error) ;
        }
       
});


// POST / HOME ADMIN-CHECK LOGIN 

router.post('/admin', async(req, res) => {

        try {
                const {username, password} =req.body;
                const user = await User.findOne({username});
                if(!user){
                        return res.status(401).json({message : "Invalid credentials"})
                }
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if(!isPasswordValid){
                        return res.status(401).json({message: "Invalid credentials"});
                }
                const token =jwt.sign({userId: user._id}, jwtSecret);
                res.cookie('token', token, {httpOnly:true});
                res.redirect('/dashboard');


        } catch (error) {
                console.log(error);
        }   
});
// POST / HOME ADMIN-REGISTER

router.post('/register', async(req, res) => {

        try {
                const {username, email, password}= req.body;
                const hashedPassword = await bcrypt.hash(password, 10);

        try { 
               const user = await User.create({username, email, password:hashedPassword});
               res.status(201).json({message: 'user created', user});
        } catch (error) {
               if(error.code === 11000){
                res.status(409).json({message: 'user already in use'});
               } 
               res.status(500).json({message: 'internal server error'});
        }

               
        } catch (error) {
                console.log(error);
        }   
});

// POST ADD-POST
router.post('/add-post',authMiddleware, async(req, res) => {
        try {
                const newPost = new Post({
                        title: req.body.title,
                        body: req.body.body
                });
                await Post.create(newPost);

                res.redirect('/dashboard')
        } catch (error) {
                
        }
       
});

// PUT ROUTE EDIT DATA
// POST EDIT-POST
router.put('/edit-post/:id', authMiddleware, async(req, res) => {
        try {
               
                await Post.findByIdAndUpdate(req.params.id, {
                        title: req.body.title,
                        body: req.body.body,
                        updatedAt: Date.now()
                });

                res.redirect('/dashboard');
        } catch (error) {
                console.log(error)
        }
       
});


      module.exports = router;
              