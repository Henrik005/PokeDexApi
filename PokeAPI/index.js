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
        if(!NAME || !EMAIL){
            return res.status(400).send(error.message)
        }
    }
    catch(error){
        res.status(500).send(error.message);
    }
    res.status(201).send("User created");
    
});

app.post("/api/capturePokemon", async (req, res) => {
  const { ID, NAME, TYPE, LOCATIONS } = req.body;
  try{
    await sql.query`INSERT INTO captured_pokemon (TrainerID, PokemonNAME, PokemonTYPE, PokemonLOCATIONS) VALUES (${ID}, ${NAME}, ${TYPE}, ${LOCATIONS})`;
  }
  catch(error){
    res.status(500).send(error.message);
}
});

// Old code for creating a table for each user
//  app.post("/api/createPokeTable", async (req, res) =>{
//      const {NAME} = req.body;
//     try{
//         const userResult = await sql.query`SELECT ID FROM users WHERE NAME = ${NAME}`
//          if (userResult.recordset.length === 0) {
//         return res.status(404).json({ error: 'User not found' });}
        
//         //const userId = userResult.recordset[0].ID;
//         const tableName = `[${NAME}_pokemon]`;
//         await sql.query(`
//     CREATE TABLE ${tableName} (
//     id INT IDENTITY(1,1) PRIMARY KEY,
//     user_id INT,
//     name VARCHAR(100) NOT NULL,
//     type VARCHAR(100) NOT NULL,
//     locations VARCHAR(500) NULL,
//     FOREIGN KEY (user_id) REFERENCES users(ID)
//   );
// `
// );
// res.status(201).json({ message: `Table ${tableName} created successfully` });
// }
//     catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// })
 

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
    
	const token = jwt.sign({USERNAME: user.NAME, EMAIL: user.EMAIL, ID: user.ID }, SECRET_KEY, { expiresIn: '1h' });
	res.json( {token });
  } catch (err) {
    res.status(500).send(err.message);
    console.log(err)
  }
});


const port = 3000;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});