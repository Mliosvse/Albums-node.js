module.exports={
  isLogin:function(req,res,next){
    if(req.session.user){
      return res.redirect('/');
    }
    next();
  },
  isNotLogin:function(req,res,next){
    if(!req.session.user){
       return res.redirect('/login');
    }
    next();
  }
}