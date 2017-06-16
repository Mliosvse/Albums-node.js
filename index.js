const express=require('express');
const nunjucks=require('nunjucks');
const mongoose=require('mongoose');
mongoose.Promise=require('bluebird');
// const db=mongoose.createConnection('mongodb://localhost:27017/album');
const db=require('./model/db.js');
const formidable=require('formidable');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const MongoStore=require('connect-mongo')(session);
const path=require('path');
const config=require('config-lite')(__dirname);
const md5=require('md5');
const app=express();
const isLogin=require('./model/check.js').isLogin;
const isNotLogin=require('./model/check.js').isNotLogin;


//配置nunjucks
nunjucks.configure('views',{
  express:app
})

//配置coolie-parser
app.use(cookieParser());
//配置session
app.use(session({
  resave:false,
  saveUninitialized:false,
  secret:'zyj',
  cookie:{maxAge:7*24*3600*1000},
  store:new MongoStore({
      url:'mongodb://localhost:27017/album'
  })
}));

//配置静态文件
app.use(express.static('public'));
app.use(express.static('upload'));

//配置自己打的中间件
app.use((req,res,next)=>{
   // 传递模板中的title(因为每个页面都要)
  app.locals.title=config.title;
  // 每一次请求都会到这个方法,一旦给req.session.user设置值,全局都可以拿到,
  // 直接传递给模板
  app.locals.user=req.session.user;
  if(req.session.user){
    app.locals.tip=req.session.user.username;
  }else{
    app.locals.tip=config.tip;
  }
  next();
})

//监听首页路由
app.get('/',(req,res)=>{
  if(req.session.user){
    const username=req.session.user.username;
    db.findUser({'username':username}).then((doc)=>{
      db.findAlbum({'author':doc._id}).then((docs)=>{
        res.render('index.njk',{'albumArr':docs});
      })
    })
  }else{
    res.render('index.njk');
  }
});

//监听登录路由
app.get('/login',isLogin,(req,res)=>{
  res.render('login.njk');
});

app.post('/login',(req,res)=>{
  var form = new formidable.IncomingForm();
 
  form.parse(req, function(err, fields, files) {
    const userName=fields.username;
    const passWord=fields.password;
    db.findUser({'username':userName}).then((doc)=>{
      if(doc){
        if(doc.password==md5(passWord)){
          req.session.user=doc;      
          // res.redirect('/');
          res.json({'msg':'登录成功'});
          return;
        }else{
          return res.json({'msg':'登录失败'});
        }
      }else{
        return res.json({'msg':'用户不存在'});
      }
    }).catch((err)=>{
      res.json({'msg':'登录失败'});
    });
  });

})

//监听注册路由
app.get('/register',isLogin,(req,res)=>{
   res.render('register.njk');
});

app.post('/register',(req,res)=>{
  //配置formidable
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    const userName=fields.username;
    const passWord=fields.password;
    const repassWord=fields.repassword;
    //通过try catch 验证是否符合要求
    try{
      db.findUser({'username':userName}).then((doc)=>{
        if(doc){
          throw new Error('用户名已存在!');
        }
      });
      if(userName.length<5||userName.length>10){
        throw new Error('用户名长度不符合要求');
      }
      if(passWord.length<6||userName.length>18){
        throw new Error('密码长度不符合要求');
      }
      if(passWord!=repassWord){
        throw new Error('密码不一致');
      }
    }catch(error){
      return res.json({'msg':error.message});
    };

    const userObj={
      'username':userName,
      'password':md5(passWord)
    }
    //往数据库中添加用户数据
    db.insertUser(userObj).then((doc)=>{
      res.json({'msg':'注册成功'});
    }).catch((err)=>{
      res.json({'msg':'注册失败'});
    })

  });

})
//监听注销路由
app.get('/outlogin',(req,res)=>{
  req.session.user=null;
  res.send('注销成功');
});

//监听管路员路由
app.get('/admin',isNotLogin,(req,res)=>{
  const name=req.session.user.username;
  db.findUser({'username':name}).then((doc)=>{
    db.findAlbum({'author':doc._id}).exec((err,docs)=>{
      if(docs){
        res.render('admin.njk',{'albumArr':docs});
      }else{
        res.render('admin.njk');
      }
    })
  });
});
//监听创建相册路由
app.post('/album/create',(req,res)=>{
  const author=req.session.user.username;
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    const album=fields.albumname;
    db.findUser({'username':author}).then((doc)=>{
      const author=doc._id;
      db.createAlbum({'albumname':album,'author':author,'photo':[]}).then((reslut)=>{
      if(reslut){
        return res.json({'msg':'创建成功'});
      }else{
        return res.json({'msg':'创建失败'});
      }
      }).catch((err)=>{
        console.log(err.message);
        return res.json({'msg':'创建失败'});
      })
    });

  });
})
//监听上传路由
app.post('/album/upload',(req,res)=>{
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname,"/upload");
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
    const photoName=path.basename(files.file.path);
    db.findOneAlbum({'albumname':fields.albumname}).then((doc)=>{
      if(doc){
        doc.photos.push(photoName);
        doc.save((err,reslut)=>{
          if(!err){
            res.json({'msg':'上传成功'});
          }else{
            res.json({'msg':'上传失败'});
          }
        })
      }else{
        res.json({'msg':'上传失败'});
      }
    })
  });
});

//监听照片展示路由
app.get('/:name',(req,res)=>{
  if(req.session.user){
    const username=req.session.user.username;
    db.findUser({'username':username}).then((doc)=>{
      db.findAlbum({'author':doc._id}).then((albums)=>{
        const albumname=req.params.name;
        let data=null;
        for(var i=0;i<albums.length;i++){
          if(albums[i].albumname==albumname){
            data=albums[i].photos;
          }
        }
        res.render('photos.njk',{'photos':data});
      })
    })
  }
});

app.listen('80');