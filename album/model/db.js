const mongoose=require('mongoose');
const db=mongoose.createConnection('mongodb://localhost:27017/album');


//配置相册数据库
//配置相册集合
const albumSchema=new mongoose.Schema({
  albumname:{
    type:String,
    required:true
  },
  author:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
    required:true
  },
  photos:[]
})

const albumModel= db.model('albums',albumSchema,'albums');

//配置用户数据表
const userSchema=new mongoose.Schema({
  username:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true
  }
});

const userModel=db.model('user',userSchema,'user');

module.exports={
  insertUser:(obj)=>{
    return userModel.create(obj);
  },
  findUser:(obj)=>{
    return userModel.findOne(obj);
  },
  createAlbum:(obj)=>{
    return albumModel.create(obj);
  },
  findAlbum:(obj)=>{
    return albumModel.find(obj);
  },
  findOneAlbum:(obj)=>{
    return albumModel.findOne(obj);
  }
}
