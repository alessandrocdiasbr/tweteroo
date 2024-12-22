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
        res.status(201).send({ _id: result.insertedId, username, tweet });
    } catch (err) {
        console.error("Erro ao postar tweet:", err);
        res.status(500).send("Erro ao postar tweet");
    }
});

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

app.put("/tweets/:id", async (req, res) => {
    const { id } = req.params;
    const { tweet } = req.body;

    const schema = joi.object({
        tweet: joi.string().required(),
    });

    const { error } = schema.validate({ tweet });
    if (error) {
        const messages = error.details.map((err) => err.message);
        return res.status(422).send(messages);
    }

    try {
        const objectId = new ObjectId(id); 
        const result = await db.collection("tweets").updateOne({ _id: objectId }, { $set: { tweet } });
        if (result.matchedCount === 0) {
            return res.status(404).send("Tweet não encontrado");
        }
        return res.status(204).send(); 
    } catch (error) {
        console.error("Erro ao atualizar tweet:", error);
        return res.status(500).send("Erro ao atualizar tweet");
    }
});

app.delete("/tweets/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const objectId = new ObjectId(id); 
        const result = await db.collection("tweets").deleteOne({ _id: objectId });
        if (result.deletedCount === 0) {
            return res.status(404).send("Tweet não encontrado");
        }
        return res.status(204).send();
    } catch (error) {
        console.error("Erro ao deletar tweet:", error);
        return res.status(500).send("Erro ao deletar tweet");
    }
});


function asyncTask(time, value) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
}


const promises = [
  asyncTask(1000, 'Primeira Promise'),
  asyncTask(2000, 'Segunda Promise'),
  asyncTask(1500, 'Terceira Promise')
];


Promise.all(promises)
  .then(results => {
    console.log('Todas as Promises foram resolvidas:', results);
  })
  .catch(error => {
    console.error('Erro ao resolver Promises:', error);
  });

const porta = process.env.PORTA || 5000;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});