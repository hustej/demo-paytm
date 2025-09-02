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
    lastname : {
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

const accountSchema = new Schema({
    userID : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    balance : {
        type : Number,
        required : true
    }
})

const User = mongoose.model('User' , userSchema);
const Account = mongoose.model('Account' , accountSchema);

module.exports = { 
    User,
    Account
 };
