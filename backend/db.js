const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://tej:JPk1accRHBUaEUgR@cluster0.3spgj.mongodb.net/');

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
})

const User = mongoose.model('User' , userSchema);

module.exports = {
    User
} ;