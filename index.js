const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: "Secret_key",
    resave: false, 
    saveUninitialized: false
}));

const templates = path.join(__dirname, 'templates');

app.get('/sign-up', (req, res) => {
  if(req.session.user){
    res.redirect('/dashboard');
    return;
  }
  res.sendFile(path.join(templates + '/registration.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(templates+ '/dashboard.html'));
});

app.post('/sign-up', async (req, res) => {
  if(req.session.user){
    res.redirect('/dashboard');
    return;
  }
  const {username, email, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  // res.json({username : req.body.username, password : hashedPassword});
  const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
  const values = [username, email, hashedPassword];
  try{
    const result = await pool.query(query, values);
    req.session.user = result.rows[0];
    res.redirect('/dashboard/')
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});

app.get('/login', (req, res) => {
  if(req.session.user){
    res.redirect('/dashboard');
  }
  res.sendFile(path.join(templates+ '/login.html'));
});

app.post('/login', async (req, res) => {
  if(req.session.user){
    res.redirect('/dashboard');
    return;
  }
  const { username, password } = req.body;
  // if (!username || !password) {
  //   return res.status(400).json({
  //     message: "You have to fill in both fields"
  //   });
  // }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const storedHashedPassword = result.rows[0].password;
      const check = await bcrypt.compare(password, storedHashedPassword);
      if (check) {
        req.session.user=result.rows[0];
        res.redirect('/dashboard');
        //res.status(200).json({message:"correct"});
        //res.json(result.rows[0]);
      } else {
        //res.status(401).send("Incorrect password");
        res.status(401).json({message:"Incorrect"});
      }
    } else {
      res.status(401).send("No user found with the provided username");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while processing the request");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});