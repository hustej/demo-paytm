const express = require("express");
const router = express.Router();
const zod = require("zod");
const argon2 = require("argon2");

const JWT_SECRET = require("../config")

const { User } = require("../db")
const { authMidlleware } = require("../middleware")

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

const updateUserInfo = zod.object({
    password : zod.string().optional().trim().min(6),
    firstname : zod.string().required().trim().max(50),
    lastname : zod.string().required().trim().max(50),
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

router.put("/" , authMidlleware , async(res , req) => {
    const validChanges = updateUserInfo.safeParse(req.body);

    if(!validChanges.success){
        return res.status(411).json({
            message : "error while updating changes"
        })
    }

    try {
        await User.updateOne(req.body , {
            _id : req.userID
        })

        res.stauts(200).json({
            messsage : "Updated successfully"
        })
    }

    catch(err){
        res.status(411).json({
            message : "error while updating changes"
        })
    }
})

router.get("/bulk" , (res , req) => {

    const filterVal = req.query.filter || "";

    const users = User.find({
        $or : [{
            firstname : {
                "$regex" : filter,
            },
            lastname : {
                "$regex" : filter
            }
        }]
    })

    res.json({
        user : users.map(user => ({
            username : user.username,
            firstname : user.firstname,
            lastname : user.lastname,
            _id : user._id
        }))
    })

})

module.exports = {
    router
}