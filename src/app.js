const express = require('express');

const app = express();



app.get("/user",(req,res)=>{
    res.send({firstname:"Arjun", age:"22"})

});


app.delete("/user",(req,res)=>{
    res.send("deleted successfully")

});
app.post("/user",(req,res)=>{
    res.send("data saved")

});
app.use("/user",(req,res)=>{
    res.send("surprice")

});

app.listen(3000,()=>{
    console.log("server is running in port 3000")
});