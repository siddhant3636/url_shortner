import mongoose from "mongoose";

const connectDB =async ()=>{
    
    await mongoose.connect(`${process.env.MONGODB_URI}/url-shortner`).then(()=>console.log("MongooDB connected ..."));
}

export default connectDB;