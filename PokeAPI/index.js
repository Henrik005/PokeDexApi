const express = require("express");
const sql = require("mssql");
const cors = require('cors');
const bcrypt = require('bcrypt')

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:8080' }));

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
		const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        await sql.query`INSERT INTO users (EMAIL, NAME, PASSWORD) VALUES (${EMAIL}, ${NAME}, ${PASSWORD})`;
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

const port = 3000;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});