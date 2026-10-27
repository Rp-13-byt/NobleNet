import mongoose from "mongoose"; import { app } from "./app.js"; import { env } from "./config.js";
await mongoose.connect(env.MONGODB_URI); app.listen(env.PORT,()=>console.log(`NobleNet API listening on ${env.PORT}`));
