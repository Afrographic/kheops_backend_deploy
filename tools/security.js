const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Axios_Private } = require("./axios");
const { DB } = require("../db");

class Security {

    static authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.sendStatus(403);
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user_data) => {
            if (err) return res.sendStatus(403);
            req.body.user_data = user_data;
            req.body.token = token;
            if (await Security.is_banned(user_data.user_id)){
                return res.sendStatus(403);
            }
            next();
        })
    } 

    static async is_banned(user_id) {
        let users = await DB.get_data("select user_id from user where user_is_banned = 1 and user_id=:user_id", { user_id });
        return users.length > 0;
    }

    static async is_top_admin(req, res, next) {
        let data = await Axios_Private.get_secure_data("/is_admin", req.body.token);
        if (data.is_admin) {
            next();
            return;
        }
        return res.sendStatus(403);
    }

    static encryptPassword(password) {
        return crypto
            .createHmac("sha256", process.env.PASSWORD_HASHING_KEY)
            .update(password)
            .digest("hex");
    }

    static generateToken(userData) {
        // infinite lasting token for dev purpose
        return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6000000000s' });
        // 10 minutes lasting token
        //return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '600s' });
    }

    static generate_password_token(userData) {
        // 10 min lasting token
        return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '600s' });
    }

    static get_random_string() {
        return crypto.randomUUID();
    }

}

module.exports.Security = Security;