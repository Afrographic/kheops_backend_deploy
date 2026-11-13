const express = require("express");
const router = express.Router();
const { serverError } = require("./../tools/serverError");
const uuid = require("uuid");

const { Security } = require("../tools/security");
const { Validator } = require("../tools/validator");
const { HelperFunction } = require("../tools/helper_function");
const { HelperFile } = require("../tools/helper_file.js");
const { OwnerShipChecker } = require("../tools/ownership_checker.js");
const { Consts } = require("../consts.js");
const { DB } = require("../db.js");
const { EmailService } = require("../tools/emailService.js");


router.post("/user/send_activation_code", Security.authenticateToken, async (req, res) => {
    try {

        let user_id = req.body.user_data.user_id;
        let user_data = await get_user_data(user_id);
        let user_activation_code = user_data.user_activation_code;
        if (user_activation_code == null) {
            user_activation_code = uuid.v1().toString().substring(0, 5).toUpperCase();
            await DB.update_data("UPDATE user set user_activation_code=:user_activation_code WHERE user_id=:user_id", { user_activation_code, user_id });
        }

        // Sending the email to the user
        EmailService.send_account_activation_code(user_data.user_username, user_data.user_email, user_activation_code);

        res.send({
            status: 200,
            msg: "Activation code sent!"
        })


    } catch (error) {
        serverError(error, res);
    }
})

async function get_user_data(user_id) {
    let data = await DB.get_data("SELECT user_activation_code,user_username,user_email FROM user WHERE user_id = :user_id", { user_id });
    return data[0];
}



// Activate account
router.post("/user/activate_account", Security.authenticateToken, async (req, res) => {
    try {
        console.log("J'allucine");
        let { user_activation_code } = req.body;
        let user_id = req.body.user_data.user_id;
        let field_ok = Validator.validateFields({ user_activation_code }, res);
        if (field_ok) {
            let data = await DB.get_data("SELECT * FROM user WHERE user_id=:user_id AND user_activation_code = :user_activation_code", { user_id, user_activation_code });
            if (data.length > 0) {
                await activate_user_account(user_id);
                res.send({
                    status: 200,
                    msg: "Activation reussi!"
                })
            } else {
                res.statusCode = 404;
                res.send({
                    msg: "Activation Code Invalid"
                })
            }
        }

    } catch (error) {
        serverError(error, res);
    }
})

async function activate_user_account(user_id) {
    await DB.update_data("UPDATE user set user_account_activated = 1  WHERE user_id=:user_id", { user_id });
}


// Get user activation state
router.get("/user/check/account/activated", Security.authenticateToken, async (req, res) => {
    try {
        console.log(req.body.user_data);
        let user_id = req.body.user_data.user_id;
        let data = await DB.get_data("SELECT user_account_activated FROM user WHERE user_id=:user_id", { user_id });
        res.send({
            status: 200,
            activated: data[0].user_account_activated != null
        })
    } catch (error) {
        serverError(error, res);
    }
})


module.exports = router;