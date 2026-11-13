const express = require("express");
const { Consts } = require("../consts");
const { Security } = require("../tools/security");
const { Validator } = require("../tools/validator");
const { HelperFunction } = require("../tools/helper_function");
const { serverError } = require("../tools/serverError");
const { HelperFile } = require("../tools/helper_file");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { DB } = require("../db");
const {  Axios_Private } = require("../tools/axios");
const router = express.Router();

// edit profile picture
router.patch("/user_avatar", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        if (!Validator.valid_image_upload(req)) {
            res.sendStatus(400);
            return;
        }

        delete_user_old_profile(user_id);

        let user_avatar = HelperFile.upload_avatar(req.files.file);

        await DB.update_data("update user set user_avatar=:user_avatar where user_id=:user_id", { user_avatar, user_id });

        res.send({ user_avatar });

       
    } catch (error) {
        serverError(error, res);
    }
})

async function delete_user_old_profile(user_id) {
    let users = await DB.get_data('select user_avatar from user where user_id=:user_id', { user_id });
    if (users.length == 0) return;
    let user_avatar = users[0].user_avatar;
    if (user_avatar.includes("default")) return;
    // avatar format http://localhost:3001/images/avatars/file_ee6b6886-202355102044932.jpg
    let array = user_avatar.split("/");
    let file_name = array[array.length - 1];
    HelperFile.remove_file(`public/images/avatars/${file_name}`);
}

router.patch("/user/user_username", Security.authenticateToken, async (req, res) => {
    try {

        let { user_username } = req.body;
        let field_ok = Validator.validateFields({ user_username }, res);
        if (!field_ok) {
            return;
        }
        user_username = user_username.trim();

        if (await user_name_taken(user_username)) {
            res.status(403).send("THis username is already taken");
            return;
        }

        user_username = HelperFunction.Ucase(user_username);


        let user_id = req.body.user_data.user_id;
        await DB.update_data("update user set user_username=:user_username where user_id=:user_id", {
            user_username, user_id
        })

        res.send({
            msg: "Username Updated successfully",
            user_username: user_username
        })


    } catch (error) {
        serverError(error, res);
    }
})

async function user_name_taken(user_username) {
    let res = await Axios_Private.get_data("/user/user_username/" + user_username);
    return res.already_taken;
}


router.patch("/user/user_email", Security.authenticateToken, async (req, res) => {
    try {

        let { user_email } = req.body;
        let field_ok = Validator.validateFields({ user_email }, res);
        if (!field_ok) {
            return;
        }
        user_email = user_email.trim();
        let user_id = req.body.user_data.user_id;
        await DB.update_data("update user set user_email=:user_email where user_id=:user_id", {
            user_email, user_id
        })

        await desactivate_user_account(user_id);
        await generate_new_activation_code(user_id);
        res.send({
            status: 200,
            msg: "Email Updated successfully",
            user_email: user_email
        })


    } catch (error) {
        serverError(error, res);
    }
})

async function desactivate_user_account(user_id) {
    await DB.update_data("update user set user_account_activated = null WHERE user_id=:user_id", { user_id })
}
async function generate_new_activation_code(user_id) {
    user_activation_code = HelperFunction.generate_activation_code();
    await DB.update_data("update user set user_activation_code = :user_activation_code WHERE user_id=:user_id", { user_activation_code, user_id })
}


module.exports = router;