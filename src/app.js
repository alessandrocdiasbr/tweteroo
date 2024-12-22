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

app.post("/sign-up", async (req, res) => { 
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

app.post("/tweets", async (req, res) => {
    const schema = joi.object({
        username: joi.string().required(),
        tweet: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).send(error.details[0].message);
    }

    const { username, tweet } = req.body;

    try {
        const user = await db.collection("users").findOne({ username });
        if (!user) {
            return res.status(401).send("Usuário não autorizado");
        }
        const result = await db.collection("tweets").insertOne({ username, tweet });        
    } catch (err) {
        console.error("Erro ao postar tweet:", err);
        res.status(500).send("Erro ao postar tweet");
    }
})

app.get("/tweets", async (req, res) => {
    try {
        const tweets = await db.collection("tweets").find().toArray();
        const tweetsWithAvatar = await Promise.all(tweets.map(async (tweet) => {
            const user = await db.collection("users").findOne({ username: tweet.username });
            return {
                _id: tweet._id,
                username: tweet.username,
                avatar: user.avatar,
                tweet: tweet.tweet
            };
        }));
        tweetsWithAvatar.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
        res.status(200).send(tweetsWithAvatar);
    } catch (err) {
        console.error("Erro ao buscar tweets:", err);
        res.status(500).send("Erro ao buscar tweets");
    }
});



const porta = process.env.PORTA || 5000;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});