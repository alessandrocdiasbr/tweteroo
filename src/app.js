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
const mongoClientUsers = new MongoClient(mongoURL);
let db;

mongoClientUsers.connect()
.then(() => {
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
    db = mongoClientUsers.db();

})
.catch((err) => console.log(err.message));






const porta = process.env.PORTA || 5000;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});