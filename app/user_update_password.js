const express = require("express");
const { db } = require("../db");
const { Consts } = require("../consts");
const { serverError } = require("../tools/serverError");
const { Security } = require("../tools/security");
const { Validator } = require("../tools/validator");
const { DB } = require("../db");
const router = express.Router();
const { EmailService } = require("../tools/emailService");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Axios_Private } = require("../tools/axios");

// Send password Reset link
router.post("/password/reset_link/:user_email", async (req, res) => {
    try {
        let user_email = req.params.user_email;
        if (!Validator.valid_email(user_email)) {
            res.statusCode = 400;
            res.send({
                status: 400,
                email: 'This email is invalid!'
            })
            return;
        }

        if (!(await has_user_with_this_email(user_email))) {
            res.statusCode = 404;
            res.send({
                status: 400,
                email: 'There is no user with this email!'
            })
            return;
        }

        // Generate password link
        let user_data = await get_user_data(user_email);
        let token = Security.generate_password_token(user_data);
        let link = `https://kheops.monraa/update_password?uid=${token}`;
        // Send password reset link via email
        EmailService.send_password_reset_link(user_data.user_username, user_email, link);

        res.send({
            status: 200,
            msg: "Password reset link send successfully!"
        })
    } catch (error) {
        serverError(error, res);
    }
})

async function get_user_data(user_email) {
    let data = await DB.get_data("SELECT user_id,user_username FROM user WHERE user_email = :user_email", { user_email });
    return data[0];
}

async function has_user_with_this_email(user_email) {
    let res = await DB.get_data("SELECT * FROM user WHERE user_email=:user_email", { user_email });
    return res.length > 0;
}




// Changing the password while knowing the old one
router.patch("/change/password", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { user_password, user_confirm_password, user_current_password } = req.body;
        let fields_ok = Validator.validateFields({ user_password, user_confirm_password, user_current_password }, res);

        if (!fields_ok) { return; }

        let axios_res = await Axios_Private.get_secure_data("/check/password/" + user_current_password, req.body.token);
        if (!axios_res.correct) {
            res.status(401).send({
                status: 401,
                msg: "Your old password is incorrect!"
            })
            return;
        }

        if (user_password != user_confirm_password) {
            res.statusCode = 403;
            res.send({
                status: 400,
                msg: "The passwords don't match!"
            })
            return;
        }

        user_password = Security.encryptPassword(user_password);
        await DB.update_data("UPDATE user set user_password = :user_password WHERE user_id=:user_id", { user_password, user_id });

        res.send({
            status: 200,
            msg: "Password modified successfully!"
        })

    } catch (error) {
        serverError(error, res);
    }
})

// Checking if the old entered password is correct
router.get("/check/password/:user_password", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        user_password = Security.encryptPassword(req.params.user_password);

        let users = await DB.get_data("select * from user where user_id=:user_id and user_password=:user_password", { user_id, user_password });

        res.send({ correct: users.length > 0 });
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;