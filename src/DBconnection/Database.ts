import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.db_port;
const user = process.env.db_user;
const password = process.env.db_password;
const domain = process.env.db_domainname;
const name = process.env.db_name;

// console.log("port ===",port);
// console.log(`${port}://${user}:${password}@${domain}/${name}`);

mongoose.connect(`${port}://${user}:${password}@${domain}/${name}`).then( () => {
  console.log("database successfully connected....");
}).catch((error) => {
  console.log("error in db connection ==> ", error);
})