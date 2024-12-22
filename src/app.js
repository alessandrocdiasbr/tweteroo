import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";

import dotenv from "dotenv";
dotenv.config();

const app = express(); 
app.use(cors());
app.use(json()); 

const mongoURL = process.env.BACKEND_URL;
const mongoClient = new MongoClient(mongoURL);
let db;

mongoClient.connect()
.then(() => {
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
   db = mongoClient.db();

})
.catch((err) => console.log(err.message));

app.post("/users", async (req, res) => {
    const schema = joi.object({
        username: joi.string().required(),
        avatar: joi.string().uri().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).send(error.details[0].message);
    }

    const user = req.body;
    try {
        const result = await db.collection("users").insertOne(user);
        res.status(201).send({ _id: result.insertedId, ...user });
    } catch (err) {
        console.error("Erro ao cadastrar usuário:", err); 
        res.status(500).send("Erro ao cadastrar usuário");
    }
});



const porta = process.env.PORTA || 5000;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});