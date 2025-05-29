import mongoose from "mongoose";


import dotenv from "dotenv";

dotenv.config();
const connectDB = async () => {
  try {
    
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_DB_URI}`
    );
    console.log(
      `data base is connected at ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Mongo_db connection failed ", error);
    process.exit(1);
  }
};

export default connectDB;
