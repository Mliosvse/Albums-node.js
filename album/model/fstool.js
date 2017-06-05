const fs=require('fs');
const path=require('path');

const albumPath=path.join(__dirname,'..','albums');

function getFiles(callback){
  fs.readdir(albumPath,(err,files)=>{
    callback(err,files);
  });
};

function getPhotos(albumName,callback){
  fs.readdir(path.join(__dirname,'..','albums',albumName),(err,files)=>{
    callback(err,files);
  });
}

// module.exports={'getFiles':getFiles};
module.exports={getFiles,getPhotos};