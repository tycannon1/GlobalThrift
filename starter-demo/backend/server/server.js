// express, morgan, express-session, ViteExpress
//imports
import express from "express"
import morgan from "morgan"
import session from "express-session"
import ViteExpress from "vite-express"

//Create Express Instance
const app = express()


//set up middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: "secretString",
    saveUninitialized: false,
    resave: false,
  })
);

import { handlerFunctions } from "./controller.js";

app.get("/api/session-check", handlerFunctions.sessionCheck);
app.post("/api/login", handlerFunctions.login);
app.get("/api/logout", handlerFunctions.logout);

//Routes

//Run the server
ViteExpress.listen(app, 1999, () => 
{console.log("Server Running On http://localhost:1999")})
