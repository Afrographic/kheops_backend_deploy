const express = require("express");
const router = express.Router();
const { serverError } = require("./../tools/serverError");
const jwt = require("jsonwebtoken");

const { Security } = require("../tools/security");
const { Validator } = require("../tools/validator");
const { HelperFunction } = require("../tools/helper_function");
const { HelperFile } = require("../tools/helper_file.js");
const { OwnerShipChecker } = require("../tools/ownership_checker.js");
const { Consts } = require("../consts.js");
const { DB } = require("../db.js");
const { EmailService } = require("../tools/emailService");

/*
TOken
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE2Njk2NzI3NDMsImV4cCI6MTY2OTY3NDI0M30.zw36gUUofEVKPvWCtb1w51F4yVTU0UBf6omp0xRMyck
*/

// Check username uniqueness
router.get("/user/user_username/:user_username", async (req, res) => {
    try {
        req.params.user_username = req.params.user_username ?? "";
        let user_username = HelperFunction.Ucase(req.params.user_username).trim()
        let reply = await DB.get_data("SELECT * FROM user WHERE user_username =:user_username", { user_username });
        let already_taken = reply.length > 0;
        res.send({ already_taken });
    } catch (error) {
        serverError(error, res);
    }
})

// check email uniqueness
router.get("/user/user_email/:user_email", async (req, res) => {
    try {
        req.params.user_email = req.params.user_email ?? "";
        let user_email = req.params.user_email.trim();
        let reply = await DB.get_data("SELECT * FROM user WHERE user_email =:user_email", { user_email });
        res.send({
            status: 200,
            already_taken: reply.length > 0
        })
    } catch (error) {
        serverError(error, res);
    }
})

// Register with login - on time shot lol too smart!
router.post("/user", async (req, res) => {
    try {
        let { user_username, user_email, user_password, user_confirm_password, } = req.body;
        let user_avatar = Consts.user_avatar;
        let allFieldOk = Validator.validateFields({ user_username, user_email, user_password, user_confirm_password, }, res);

        if (!allFieldOk) {
            return;
        }

        if (user_password != user_confirm_password) {
            res.sendStatus(401);
            return;
        }

        let user_address = HelperFunction.generate_address();

        // Ecncrypting the password
        user_password = Security.encryptPassword(user_password);
        let user_created_date = new Date();
        user_username = HelperFunction.Ucase(user_username);

        let user = await DB.post_data("INSERT INTO user(user_username,user_avatar,user_email,user_password,user_address,user_created_date) VALUES (:user_username,:user_avatar,:user_email,:user_password,:user_address,:user_created_date) ", { user_username, user_avatar, user_email, user_password, user_address, user_created_date });
        let user_id = user[0];
        let token = Security.generateToken({ user_id });

        res.send({ token });

    } catch (error) {
        serverError(error, res);
    }
})

// Login with username or email
router.post("/login", async (req, res) => {
    try {
        let { user_email, user_username, user_password } = req.body;
        let allFieldOk = Validator.validateFields({ user_password }, res);
        if (!allFieldOk) {
            return;
        }
        user_email = user_email ?? "";
        user_username = user_username ?? "";
        user_username = HelperFunction.Ucase(user_username);
        user_password = Security.encryptPassword(user_password);

        let user = await DB.get_data("SELECT user_username,user_id FROM user where user_password =:user_password and (user_email = :user_email or user_username=:user_username)", {
            user_email, user_password, user_username
        })

        if (user.length > 0) {
            await send_tfa_code(user[0].user_username, user_email);

            res.send({
                status: 200,
            })
        } else {
            res.statusCode = 404;
            res.send({
                status: 400,
                msg: "This user does not exist!"
            })
        }

    } catch (error) {
        serverError(error, res);
    }

})

async function send_tfa_code(username, user_email) {
    let tfa_code = HelperFunction.generate_5_digit_code();
    EmailService.send_login_code(username, user_email, tfa_code);
    await DB.update_data("update user set tfa_code=:tfa_code where user_email=:user_email", { user_email, tfa_code });
}

// verify login code
router.get("/verify_login/email/:email/code/:code", async (req, res) => {
    try {
        let code = req.params.code;
        let email = req.params.email;
        let data = await DB.get_data("select user_id from user where (user_email =:email or user_username=:email) and tfa_code=:code", { email, code });

        if (data.length > 0) {
            let token = Security.generateToken(data[0]);
            res.send({
                can_log_in: true,
                token: token
            })
            return;
        }

        res.send({
            can_log_in: false
        })
    } catch (error) {
        serverError(error, res);
    }
})


// authenticate user token
router.get("/user/token/:token", async (req, res) => {
    try {
        let token = req.params.token;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user_data) => {
            if (err) return res.sendStatus(403);
            req.body.user_data = user_data;
            // check if user still exist!
            let user_id = user_data.user_id;
            let users = await DB.get_data("select user_id from user where user_id=:user_id", { user_id });
            if (users.length == 0) return res.sendStatus(403);

            res.send({
                status: 200,
                user_id: user_data.user_id
            })
        })
    } catch (error) {
        serverError(error, res);
    }
})

// Get user data
router.get("/user", Security.authenticateToken, async (req, res) => {
    try {

        let user_id = req.body.user_data.user_id;
        let user_data = await DB.get_data("SELECT user_id,user_username,user_avatar,user_email,user_balance,user_address,user_account_activated ,user_is_banned,user_created_date FROM user WHERE user_id=:user_id", { user_id });

        res.send({
            status: 200,
            user_data: user_data[0]
        })

    } catch (error) {

        serverError(error, res);
    }
})

// get user_name from address
router.get("/user_name/:address", Security.authenticateToken, async (req, res) => {
    try {
        let address = req.params.address;
        let users = await DB.get_data('select user_username from user where user_address=:address', { address });
        res.send({
            address_exist: users.length > 0,
            users: users
        })
    } catch (error) {
        serverError(error, res);
    }
})


// transfer cash to another account
router.post('/transfer', Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { user_address, amount } = req.body;
        if (!Validator.validateFields({ user_address, amount }, res)) {
            return;
        }

        let user_balance = await get_user_balance(user_id);
        let total_amount = parseInt(amount) + 2 / 100 * parseInt(amount);

        if ((parseInt(amount) + 2 / 100 * parseInt(amount)) > user_balance) {
            res.status(401).send("Insufficient balance!")
            return;
        }

        await create_transfer_instance(user_id, user_address, amount);

        await DB.update_data("update user set user_balance = user_balance - :total_amount where user_id=:user_id", { total_amount, user_id });

        await DB.update_data("update user set user_balance = user_balance + :amount where user_address=:user_address", { amount, user_address });

        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

async function get_user_balance(user_id) {
    let users = await DB.get_data('select user_balance from user where user_id=:user_id', { user_id });
    return users[0].user_balance;
}

async function create_transfer_instance(transfer_sender_id, transfer_receiver_address, transfer_amount) {
    let transfer_gain = 2 / 100 * transfer_amount;
    let transfer_created_date = new Date();
    await DB.post_data("insert into transfer(transfer_amount,transfer_sender_id,transfer_receiver_address,transfer_gain,transfer_created_date) values(:transfer_amount,:transfer_sender_id,:transfer_receiver_address,:transfer_gain,:transfer_created_date)", { transfer_amount, transfer_sender_id, transfer_receiver_address, transfer_gain, transfer_created_date });
}
module.exports = router;