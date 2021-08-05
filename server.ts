import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", async (req, res) => {
  try {
    const dbres = await client.query('select * from pastes');
    res.json(dbres.rows);
  }
  catch (ex) {
    console.log("Error", ex)
    res.json(ex)
  }
});

app.get("/pastes/", async (req, res) => {
  try {
    const {rows} = await client.query('SELECT * FROM pastes ORDER BY time LIMIT 10')
    res.json(rows)
  }
  catch (ex) {
    res.json
  }

});

app.post("/pastes/", async (req, res) => {
  try {
    if (req.body.title === undefined) {
      await client.query("INSERT INTO pastes (paste) VALUES ($1)", [req.body.paste])
      res.status(201).json({
        status: "Success!"
      })
    }
    else {
      await client.query("INSERT INTO pastes (paste, title) VALUES ($1, $2)", [req.body.paste, req.body.title])
      res.status(201).json({
        status: "Success!"
      })
    }
  }
  catch {
    res.status(400).json({
      status: "Fail"
    })
    console.log("fail")
  }
})


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
