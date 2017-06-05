const express=require('express');
const app=express();
const album=require('./router/album.js');
const nunjucks=require('nunjucks');

nunjucks.configure('views',{
  express:app
});

app.use(express.static('public'));
app.use(express.static('albums'));

app.get('/',(req,res)=>{
  res.redirect('/all');
});

app.use('/',album);

app.use((err,req,res,next)=>{
  // res.send('出错了!');
  res.send(err);
});

app.listen(80);