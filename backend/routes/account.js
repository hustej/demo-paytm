const express = require("express");
const router = express.Router();

const { Account } = require("../db")

router.get("/balance" , async (res , req) => {
    const userID = req.userID;

    const account = await Account.findOne({ userID : userID });

    if(!account){
        return res.status(411).json({
            message : "account doesnot exist"
        })
    }

    res.json({
        balance : account.balance
    })
})

router.post("/transfer" , async (req,res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const {amount , to} = req.body;

    const account = await Account.findOne({ userID : userID}).session(session);

    if(account.balance < amount || !account){
        await session.abortTransaction();
        return res.status(411).json({
            message : "Insufficient balance"
        });
    }

    const toAccount = Account.findOne({ userID : to}).session(session);

    if(!toAccount){
        await session.abortTransaction();
        return res.status(411).json({
            message : "Invalid Account"
        })
    }

    await Account.updateOne({ userID : req.userID } , { $inc: { balance : -amount } }).session(session);
})
    await Account.updateOne({ userID : to} , { $inc: {balance : amount } }).session(session);

    await session.commitTransaction();
    res.json({
        message : "Tansefer successfull"
    })


module.exports = {
    router
}
