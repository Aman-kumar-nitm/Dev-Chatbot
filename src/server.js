const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan=require('morgan');
const cookieParser=require('cookie-parser');
const connectDB=require('./config/db')
const helmet = require("helmet");



dotenv.config();


const app = express();
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);
const passport = require("./config/passport");
app.use(passport.initialize());

app.use(helmet());
app.use(morgan('tiny'));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, 
   
    credentials: true, 
  })
);

app.use(express.json());




// Routes
const authRouter=require('./routes/authRoutes')
const chatRouter=require('./routes/chatRoutes');
const paymentRouter = require('./routes/paymentRoutes');
app.use('/api/auth', authRouter);
app.use('/api/chat',chatRouter);
app.use('/api/payment',paymentRouter);
//start the server
const PORT = process.env.PORT || 5000;
const start=async()=>{
    try {
        await connectDB(process.env.MONGO_URL);
        app.listen(PORT,()=>{ console.log(`server is listening on Port:${PORT}`);})
       
    } catch (error) {
        console.log('Unable to Start Server')
        console.error(error);
        process.exit(1);
    }
}
start();
