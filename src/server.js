import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

// Create express app
// npx babel-node src/server.js or npx nodemon --exec babel-node src/server.js


const app = express();

app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try{
        // Connect to the mongo server
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('unilia-blog');
        
        await operations(db);
        client.close();
    }
    catch(error){
        res.status(500).json({ message: "Error connecting to db", error });
    }

};

app.get('/api/articles/:name', async (req, res) => {

    withDB( async (db) => {
        const articleName = req.params.name;    
        // Get the articles
        const articlesInfo = await db.collection('articles').findOne({ name: articleName});
        res.status(200).json(articlesInfo);
    }, res);  

});

app.get('/hello', (req, res) => res.send("Hello"));
app.get('/hello/:name', (req, res) => res.send(`Hello ${ req.params.name }`));
app.post('/hello', (req, res) => res.send(`Hello ${ req.body.name }`));

// Upvotes to articles 
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

});
// Add comments
app.post('/api/articles/:name/add-comment', async (req, res) => {
	
    withDB(async (db) => {
        const { username, text } = req.body;
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({
                    username, text
                }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);
});


app.listen(8000, () => console.log("Listening on port: 8000"));


