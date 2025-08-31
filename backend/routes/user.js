const express = require("express");
const router = express.Router();
const zod = require("zod");
const argon2 = require("argon2");
const JWT_SECRET = require("../config")

const { User } = require("../db")

const userSignupSchema = zod.strictObject({
    username : zod.string().email().trim().required(),
    firstname : zod.string().required().trim().max(50),
    lastname : zod.string().required().trim().max(50),
    password : zod.string().required().min(6),
})

const userSigninSchema = zod.strictObject({
    username : zod.string().email().required(),
    password : zod.string().required()
})

router.post('/signup' , async (req , res) => {
    const validUser = userSignupSchema.safeparse(req.body);

    if(!validUser.success){
        return res.status(411).json({
            message : "Email already taken / Incorrect inputs"
        }) 
    }

    const userExist = await User.findOne({
        username : req.body.username
    })

    if(userExist){
         return res.status(411).json({
            message : "Email already taken / Incorrect inputs"
        })
    }

    const plainPassword = req.body.password;

    const hashedPassword = async (plainPassword) => {
        try{
            return await argon2.hash(plainPassword)
        }
        catch(err){
            console.log("error while hashing password : " , err)
        }
    }

    const hashedPasswordValue = await hashedPassword(plainPassword);
    
    const user = await User.create({
        username : req.body.username,
        password : hashedPasswordValue,
        firstname : req.body.firstname,
        lastname : req.body.lastname,
    })
    const userID = user._id;

    const token = jwt.sign({
        userID
    },JWT_SECRET)

    res.status(200).json({
        message : "User created successfully",
	    token: token
    })

})

router.post('/signin' , async (req , res) => {
    const validInputs = userSigninSchema.safeParse(req.body);

    if(!validInputs.success){
        return res.status(411).json({
            message : "error while logging in"
        })
    }

    const username = req.body.username;
    const enteredPassword = req.body.password;

    const user = await User.findOne({username : username});

    if(!user){
        return res.status(411).json({
            message : "user not found"
        })
    }

    const userID = user._id;


    try{

        const isPasswordValid = await argon2.verify(user.password , enteredPassword)

        if(!isPasswordValid){
            return res.status(411).json({
                message : "Invalid password"
            })
        }

        const token = jwt.sign({
            userID
        },JWT_SECRET)

        res.status(200).json({
            token : token
        })

    }
    catch (err){
        return res.status(411).json({
            message : "error while verifynig password"
        })
    }

})


module.exports = {
    router
}