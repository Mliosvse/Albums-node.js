const express=require('express');
const router=express.Router();
const fstool=require('../model/fstool.js');
const fs=require('fs');
const path=require('path');

router.get('/all',(req,res,next)=>{
  fstool.getFiles(function(err,arr){
    if(err){
      next(err);
      return;
    }
    let albumArrs=[];
    const len=arr.length;

    //通过for循环遍历数组,在回调内部渲染网页,以防止异步导致的albumArrs数组为空
    // for(let i=0;i<len;i++){
    //    fs.stat(path.join(__dirname,'..','albums',arr[i]),(err,data)=>{
    //       if(data.isDirectory()){
    //       albumArrs.push(arr[i]);
    //       if(i==len-1){
    //         res.render('index.njk',{'albumArr':albumArrs});
    //       }
    //     }
    //   })
    // }

    //通过立即执行函数(小闭包),结合递归函数,遍历数值,取出文件夹,并且在递归调用结束时渲染页面
  !function checkDir(index){
    const file=arr[index];
    if(index==len){
        res.render('index.njk',{'albumArr':albumArrs});
        return;
    }
    fs.stat(path.join(__dirname,'..','albums',file),(err,data)=>{
      if(data.isDirectory()){
          albumArrs.push(file);
        }
        checkDir(index+1);
      });
    }(0);
  });
});

router.get('/:name',(req,res,next)=>{
  fstool.getPhotos(req.params.name,function(err,file){
    if(err){
      return next(err);
    }
    res.render('photo.njk',{'photos':file});
  })
});

module.exports=router;