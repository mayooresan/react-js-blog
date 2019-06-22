import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')))

const withDB = async(res, operations) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
    const db = client.db('my-blog');
    
    await operations(db)

    client.close();
  } catch (error) {
    res.status(500).json({message: "something went wrong", error});
    console.log(error);
  }
}

app.get('/api/articles/:name', async (req, res)=>{
  await withDB(res, async(db)=>{
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({name: articleName});
    res.status(200).json(articleInfo);
  });
  
});

app.post('/api/articles/:name/upvote', async(req, res) => {
    
    await withDB(res, async(db)=>{
      const articleName = req.params.name;
      const articleInfo = await db.collection('articles').findOne({name: articleName});
      await db.collection('articles').updateOne({name: articleName}, {
          '$set': {
            upvotes: articleInfo.upvotes + 1
          }
      })
      const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
      res.status(200).json(updatedArticleInfo);
    })
    
});

app.post('/api/articles/:name/add-comment', (req, res) => {
  const {username, text} = req.body;
  const articleName = req.params.name;
  

  withDB(res, async(db)=>{
      const articleInfo = await db.collection('articles').findOne({name: articleName});
      await db.collection('articles').updateOne({name: articleName}, {
        '$set': {
          comments: articleInfo.comments.concat({username, text})
        }
      })
      const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
      res.status(200).json(updatedArticleInfo);
  });
});

app.get('*', (req, res)=>{
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('listening on port 8000'));