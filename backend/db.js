const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI) 
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        minLength : 3,
        maxLength : 30
    },
    firstname : {
        type : String,
        required : true,
        trim : true,
        maxLength : 50
    },
    lastName : {
        type : String,
        required : true,
        trim : true,
        maxLength : 50
    },
    password : {
        type : String,
        required : true,
        minLength : 6
    }
});

const User = mongoose.model('User' , userSchema);

module.exports = { 
    User
 };
