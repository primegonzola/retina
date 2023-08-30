
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import express, { urlencoded, json } from "express";

const app = express();
app.use(
    cors({
        origin: ["http://localhost"],
        credentials: true,
    })
);

app.use(urlencoded({ extended: false }));
app.use(json());
app.use(cookieParser());

// set up static folders
app.use(express.static(path.resolve(__dirname, '../data')));
app.use(express.static(path.resolve(__dirname, '../build')));
app.use(express.static(path.resolve(__dirname, '../src/static')));

// start the app and listen on give port
app.listen(8080, () => {
    // log to output we started the server
    console.log("engine serving at port 8080")
});
