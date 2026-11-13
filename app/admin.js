const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const { EmailService } = require("../tools/emailService");
const router = express.Router();


// banish admin
router.patch("/banish_admin/:user_id", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let user_id = req.params.user_id;
        await DB.update_data("update admin set admin_banned = 1 WHERE user_id=:user_id", {
            user_id
        })
        // send email to admin
        await send_banish_email(user_id);
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

async function send_banish_email(user_id) {
    let user_data = await HelperFunction.get_user_data_from_id(user_id);
    if (user_data.length == 0) return;
    EmailService.notify_banish_admin(user_data[0].user_username, user_data[0].user_email);
}

// get all the admins
router.get("/admin", Security.authenticateToken, async (req, res) => {
    try {
        let users = await DB.get_data("select user.user_id,user_username,user_avatar from admin,user where admin.user_id = user.user_id and admin_banned = 0");
        res.send(users);
    } catch (error) {
        serverError(error, res);
    }
})


// determine is a user is an admin
router.get("/is_admin", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let users = await DB.get_data("select * from admin where user_id=:user_id and admin_banned = 0", { user_id });
        res.send({ is_admin: users.length > 0 });
    } catch (error) {
        serverError(error, res);
    }
})

// determine is a user is an admin
router.get("/is_admin/:user_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.params.user_id;
        let users = await DB.get_data("select * from admin where user_id=:user_id and admin_banned = 0", { user_id });
        res.send({ is_admin: users.length > 0 });
    } catch (error) {
        serverError(error, res);
    }
});

module.exports = router;