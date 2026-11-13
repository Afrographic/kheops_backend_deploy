const express = require("express");
const { DB } = require("../db");
const { HelperFile } = require("../tools/helper_file");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const { Axios_Private } = require("../tools/axios");
const router = express.Router();

router.post("/message", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_created_date = new Date();
        let { chat_id, message_reply_id } = req.body;
        message_content = req.body.message_content.trim() ?? "";
        let fields_ok = Validator.validateFields({ chat_id, message_reply_id });

        if (!fields_ok) {
            return;
        }

        if (!(await chat_open(chat_id))) {
            res.sendStatus(401);
            return;
        }

        message_content = HelperFunction.Ucase(message_content);

        let message;

        if (message_reply_id == 0) {
            message = await DB.post_data("insert into message(message_content,message_created_date,chat_id,user_id) values(:message_content,:message_created_date,:chat_id,:user_id)", { message_content, message_created_date, chat_id, user_id });

        } else {
            message = await DB.post_data("insert into message(message_content,message_created_date,message_reply_id,chat_id,user_id) values(:message_content,:message_created_date,:message_reply_id,:chat_id,:user_id)", { message_content, message_created_date, message_reply_id, chat_id, user_id });
        }

        let message_id = message[0];

        res.send({ message_id });
    } catch (error) {
        serverError(error, res);
    }
})

async function chat_open(chat_id) {
    let chats = await DB.get_data("select chat_closed from chat where chat_id=:chat_id", { chat_id });
    if (chats.length == 0) {
        return false;
    }
    return chats[0].chat_closed == 0;
}

// edit text message
router.patch("/text/message/:message_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_id = req.params.message_id;
        let { message_content, message_reply_id } = req.body;

        let field_ok = Validator.validateFields({ message_content, message_reply_id }, res);
        if (!field_ok) {
            return;
        }

        message_content = HelperFunction.Ucase(message_content);

        await DB.update_data("update message set message_content=:message_content where message_id=:message_id and user_id=:user_id", { message_content, message_id, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

// point media to new message
router.post("/point_media/message/:message_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_id = req.params.message_id;
        let { message_id_new } = req.body;

        if (!Validator.validateFields({ message_id_new }, res)) {
            return;
        }

        await DB.update_data("update message_audio set message_id=:message_id_new where message_id=:message_id and user_id=:user_id", { message_id, message_id_new, user_id })

        await DB.update_data("update message_image set message_id=:message_id_new where message_id=:message_id and user_id=:user_id", { message_id, message_id_new, user_id })

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

// Delete message
router.delete("/message/:message_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_id = req.params.message_id;


        if (!(await OwnerShipChecker.is_message_owner(message_id, user_id))) {
            res.sendStatus(401);
            return;
        }


        await delete_images(message_id, req.body.token);
        await delete_audios(message_id, req.body.token);


        await DB.delete_data("delete from message where message_id=:message_id", { message_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

async function delete_images(message_id, token) {
    let images = await DB.get_data("select * from message_image where message_id=:message_id", { message_id });
    for (const image of images) {
        await Axios_Private.delete("/message_image/" + image.message_image_id, token);
    }
}

async function delete_audios(message_id, token) {
    let audios = await DB.get_data("select * from message_audio where message_id=:message_id", { message_id });
    for (const audio of audios) {
        await Axios_Private.delete("/message_audio/" + audio.message_audio_id, token);
    }
}

// get a single message
router.get("/message/:message_id/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;
        let message_id = req.params.message_id;

        // Only two people can access messages from a chat : 
        // the one who issued the recharge and the admin who handled it
        let condition1 = await OwnerShipChecker.is_recharge_owner(recharge_id, user_id);

        let condition2 = true;
        let is_admin = await OwnerShipChecker.is_admin(user_id);
        if (is_admin) {
            condition2 = await OwnerShipChecker.is_recharge_admin_owner(recharge_id, user_id);
        }

        if (!(condition1 || condition2)) {
            res.sendStatus(401);
            return;
        }

        let messages = await DB.get_data("select user_username,message.* from message,user where message_id=:message_id and message.user_id = user.user_id", { message_id });

        if (messages.length == 0) {
            res.sendStatus(401);
            return;
        }

        res.send(messages[0]);
    } catch (error) {
        serverError(error, res);
    }
})



// get messages of a specific chat
router.get("/messages/chat/:chat_id/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {

        let recharge_id = req.params.recharge_id;
        let chat_id = req.params.chat_id;
        let user_id = req.body.user_data.user_id;


        // Only two people can access messages from a chat : 
        // the one who issued the recharge and the admin who handled it
        let condition1 = await OwnerShipChecker.is_recharge_owner(recharge_id, user_id);
        let condition2 = true;
        let is_admin = await OwnerShipChecker.is_admin(user_id);
        if (is_admin) {
            condition2 = await OwnerShipChecker.is_recharge_admin_owner(recharge_id, user_id);
        }

        if (!(condition1 || condition2)) {
            res.sendStatus(401);
            return;
        }

        let messages = await DB.get_data("select user_avatar,user_username,message.* from message,user where chat_id=:chat_id and message.user_id = user.user_id  order by message_id DESC ", { chat_id });

        res.send(messages);
    } catch (error) {
        serverError(error, res);
    }
})

module.exports = router;