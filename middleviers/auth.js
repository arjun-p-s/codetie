 const authentication = (req,res,next)=>{
    console.log('auth running')
    res.send('i am here')
    next();
 }

module.exports ={
    authentication
}