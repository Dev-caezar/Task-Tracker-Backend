import jwt from "jsonwebtoken"

export const authenciateUser = async (req, res, next) => {
    try {
       const token = req.headers.authorization.split(" ")[1];
       if (!token) {
        return res.status(401).json({message: "Unauthorized"})
       }
       const validToken = await jwt.verify(token, process.env.JWT_SECRET, (err, data) =>{
        if (err) {
            console.log(err.message);
            return res.status(400).json({
                message: "Token is not valid",
            })
        }
        req.user = data
        next()
       })
    } catch (error) {
        console.log(err.message)
        res.status(500).json({
            message: "internal server error"
        })
    }
}