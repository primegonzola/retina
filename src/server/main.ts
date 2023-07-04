
import cors from "cors";
import express, { urlencoded, json } from "express";
import cookieParser from "cookie-parser";
import path from "path";

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

// app.get('/resources', (req, res) => {
//     res.send('Hello Resources!')
// });

// set up static folders
app.use(express.static(path.resolve(__dirname, '../build')));
app.use(express.static(path.resolve(__dirname, '../src/static')));
app.use(express.static(path.resolve(__dirname, '../data')));

// start the app and listen on give port
app.listen(8080, () => {
    // log to output we started the server
    console.log("express serve at port 8080")
});
