const JWT_SECRET = require("./config");

function authMiddleware(res , req, next){
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(403).json({})
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token , JWT_SECRET);
        req.userID = decoded.userID;

        next();
    }
    catch(err){
        return res.status(411).json({})
    }
}


module.exports = {
    authMiddleware
}