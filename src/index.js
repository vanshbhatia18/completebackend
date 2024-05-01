import { app } from "./app.js";
import connectDB from "./db/index.js";
//import { configDotenv } from "dotenv";

import dotenv from "dotenv";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`listning on the port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("Mongo_Db connection failed", error);
  });
/*
(async () => {
  try {
    await new Promise((resolve, reject) => {
      mongoose
        .connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`)
        .then(() => {
          console.log("database connected");

          app.on("error", (error) => {
            console.log("ERR", error);
            throw error;
          });
          app.listen(process.env.PORT, () => {
            console.log(`Listning on th port ${process.env.PORT}`);
          });
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  } catch (e) {
    console.log(e);
  }
})();
*/
