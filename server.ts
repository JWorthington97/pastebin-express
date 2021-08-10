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
    const {rows} = await client.query('SELECT * FROM pastes ORDER BY time DESC LIMIT 10')
    res.json(rows)
  }
  catch (ex) {
    console.log(ex.message)
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
  catch (ex) {
    res.status(400).json({
      status: ex.message
    })
    console.error(ex.message)
  }
})

// Comments
app.get("/pastes/comments/:id", async (req, res) => {
  try {
    const {rows} = await client.query("SELECT * FROM comments WHERE paste_id = $1 ORDER BY time desc", [req.params.id])
    res.status(200).json(
      rows
    )
  }
  catch (ex) {

  }
})

app.post("/pastes/comments", async (req, res) => {
  try {
    await client.query("INSERT INTO comments (paste_id, comment) VALUES ($1, $2)", [req.body.paste_id, req.body.comment])
    res.status(201).json({
      status: "success!"
    })
  }
  catch (ex) {
    console.log(ex.message)
    res.status(400).json({
      status: ex.message
    })
  }
})

app.delete("/pastes/comments", async (req, res) => {
  try {
    await client.query("DELETE FROM comments where id = $1", [req.body.id])
    res.status(410).json({
      status: "deleted"
    })
  }
  catch (ex) {
    console.log(ex.message)
    res.status(400).json({
      status: ex.message
    })
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
