import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";

import dotenv from "dotenv";
dotenv.config();

const app = express(); 
app.use(cors());
app.use(json()); 



const porta = process.env.PORTA || 5000;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});