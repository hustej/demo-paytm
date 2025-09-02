const express = require("express");
const router = express.Router();
const zod = require("zod");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken")

const JWT_SECRET = require("../config")

const { User } = require("../db")
const { Account } = require("../db")
const { authMiddleware } = require("../middleware")

const userSignupSchema = zod.strictObject({
    username : zod.string().email().trim(),
    firstname : zod.string().trim().max(50),
    lastname : zod.string().trim().max(50),
    password : zod.string().min(6),
})

const userSigninSchema = zod.strictObject({
    username : zod.string().email(),
    password : zod.string()
})

const updateUserInfo = zod.object({
    password: zod.string().trim().min(6).optional(), 
    firstname: zod.string().trim().max(50).optional(),
    lastname: zod.string().trim().max(50).optional(),
});


router.post('/signup' , async (req , res) => {
    const validUser = userSignupSchema.safeParse(req.body);

    if(!validUser.success){
        return res.status(411).json({
            message : "Incorrect inputs"
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

    const assignRandomBalance = (Math.random() * 10000) + 1

    await Account.create({
        userID : userID,
        balance : assignRandomBalance
    })

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

router.put("/", authMiddleware, async (req, res) => {
    const validChanges = updateUserInfo.safeParse(req.body);

    if (!validChanges.success) {
        return res.status(411).json({
            message: "Error while updating changes",
        });
    }

    const updateData = {};

    if (req.body.password) {
        updateData.password = await argon2.hash(req.body.password); // Hash the password if it's being updated
    }
    if (req.body.firstname) {
        updateData.firstname = req.body.firstname;
    }
    if (req.body.lastname) {
        updateData.lastname = req.body.lastname;
    }

    try {
        await User.updateOne({ _id: req.userID }, { $set: updateData });

        return res.status(200).json({
            message: "Updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error while updating changes",
        });
    }
});


router.get("/bulk" , async (req , res) => {

    const filter = req.query.filter || "";

    const users = await User.find({
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

module.exports = router