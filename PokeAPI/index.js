const express = require("express");
const sql = require("mssql");
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
app.use(cors({ 
origin: 'http://localhost:8080',
methods: ['GET', 'POST', 'PUT', 'DELETE'],
 }));

const config = {
	user: 'henriko',
	password: '12345',
	server: 'localhost\\SQLEXPRESS',
	database: 'pokedexDB',
	options: {
		trustServerCertificate: true,
		connectionTimeout: 30000
	}
};
sql.connect(config, (error) => {
	if (error) console.error(error);
	else console.log("Connected to the database.");
});


app.get("/api/getAllUsers", async (req, res) => {
	try{
		const result = await sql.query`SELECT * FROM users`;
		console.log(result)
		res.send(result);
	} catch (error){
		 res.send(error.message);
	}
});


app.get("/api/getUserById/:id", async (req, res) => {
    const {id} = req.params;
    try{
        const result = await sql.query`SELECT * FROM users WHERE ID = ${id}`;
        res.status(200).send(result);
    }
    catch (error) {
        res.status(400).send(error.message);
    }
});

app.post("/api/createUser", async (req, res) => {
    const {EMAIL, NAME, PASSWORD } = req.body;
    try {
		  const hashedPASSWORD = await bcrypt.hash(PASSWORD, 10);
        await sql.query`INSERT INTO users (EMAIL, NAME, PASSWORD) VALUES (${EMAIL}, ${NAME}, ${hashedPASSWORD})`;
        res.status(201).send("User created");
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.put("/api/UpdateUserAtId/:id", async (req, res) => {
	const { id } = req.params;
	const { EMAIL, NAME, AGE } = req.body;
	try {
		const result = await sql.query`UPDATE users SET EMAIL = ${EMAIL}, NAME = ${NAME}, AGE = ${AGE} WHERE ID = ${id}`;
		if (result.rowsAffected[0] > 0) {
			res.send("User updated");
		} else {
			res.status(404).send("User not found");
		}
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.delete("/api/deleteUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql.query`DELETE FROM users WHERE ID = ${id}`;
        if (result.rowsAffected[0] > 0) {
            res.send("User deleted");
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const SECRET_KEY = "veryveryverysecurekey12345"
app.post("/api/login", async (req, res) => {
  const { USERNAME, PASSWORD } = req.body;
  try {
    const result = await sql.query`SELECT * FROM users WHERE NAME = ${USERNAME}`;

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    const user = result.recordset[0];
    const match = await bcrypt.compare(PASSWORD, user.PASSWORD);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }
    
	const token = jwt.sign({USERNAME: user.NAME, EMAIL: user.EMAIL }, SECRET_KEY, { expiresIn: '1h' });
	res.json( {token });
    console.log(token)
  } catch (err) {
    res.status(500).send(err.message);
    console.log(err)
  }
});


const port = 3000;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});