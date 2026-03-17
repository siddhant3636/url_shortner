  import 'dotenv/config';
  import express from 'express';
  import session from 'express-session';
  import { RedisStore } from "connect-redis";
  
  import connectDb from './src/configs/mongodb.js';
  import redisClient, { connectRedis } from './src/configs/redis.js';
  import cookieParser from "cookie-parser";
  import userRouter from './src/routes/userRoute.js';
  import authRouter from './src/routes/authRoute.js';
  import urlRouter from './src/routes/urlRoute.js';
  import adminRouter from './src/routes/adminRoute.js';
  import urlModel from './src/models/urlModel.js';
  import { mongoSanitizer } from './src/middleware/mongoSanitizer.js';

  import path from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);


  const app = express();
  const PORT = 3000;
 
  //connect
  connectDb();
  connectRedis();
  app.set("trust proxy", true);

  //middleware 
  app.use(express.json());
  app.use(express.urlencoded({extended:false}));
  app.use(cookieParser());
  app.use(mongoSanitizer);// Prevent NoSQL Injection (Removes $ and . from req.body, req.query, req.params)
  




  // Configure sessions
app.use(session({
  store: new RedisStore({ 
    client: redisClient,
    prefix: "session:" 
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS in production
    httpOnly: true, 
    sameSite: "lax", 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  } 
}));


  

 
 

  //set ejs
  app.set('views', path.join(__dirname, 'src', 'views')); 
  app.set('view engine', 'ejs');
  app.use(express.static(path.join(__dirname, 'public')));

  
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null; 
    next();
  });
//routes

app.get("/", async (req, res) => {
  let userUrls = [];

  try {
    // If user is logged in, find all their links
    if (req.session.user) {
      userUrls = await urlModel.find({ 
        createdBy: req.session.user.id, 
        isDeleted: false 
      }).sort({ createdAt: -1 }); // Sorts by newest first
    }

    // Render the page and pass BOTH the user and the urls array
    res.render("landing", { 
     user: req.session.user || null,
     urls: userUrls,
     currentDomain: req.get('host') 
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Internal Server Error");
  }
});

  app.use('/api/users',userRouter);
  app.use('/api/auth',authRouter);
  app.use('/api/url',urlRouter);
  app.use('/api/admin',adminRouter);

  app.get("/admin/login", (req, res) => {
    res.render("login", { adminMode: true }); 
  });












app.listen(PORT ,console.log(`Server Started At port : ${PORT}`));
