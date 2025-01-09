const mongoose = require('mongoose');
 const  dbConnect= async()=> {
   await  mongoose.connect('mongodb+srv://arjunps:micronode@nodedev.g64vz.mongodb.net/codetie')
}


module.exports={ dbConnect }