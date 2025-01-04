const express = require('express');

const app = express();

app.use("/test",(req,res)=>{
    res.send("helo there")

});
app.use("/hai",(req,res)=>{
    res.send("helo mone")

});

app.listen(3000,()=>{
    console.log("server is running in port 3000")
});