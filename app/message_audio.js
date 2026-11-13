const express = require("express");
const router = express.Router();
const { Consts } = require("../consts.js");
const { DB } = require("../db");
const { HelperFile } = require("../tools/helper_file.js");
const { HelperFunction } = require("../tools/helper_function.js");
const { OwnerShipChecker } = require("../tools/ownership_checker.js");
const { Security } = require("../tools/security.js");
const { serverError } = require("../tools/serverError.js");
const { Validator } = require("../tools/validator.js");

router.post("/message_audio", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_audio_created_date = new Date();
        let { message_id, message_audio_duration } = req.body;
        if (!Validator.validateFields({ message_id, message_audio_duration }, res)) {
            return;
        }

        if (!Validator.valid_voice_upload(req)) {
            res.sendStatus(401);
            return;
        }

        let message_audio_size = req.files.file.size;
        let message_audio_url = HelperFile.upload_file(req.files.file);

        let message_audio = await DB.post_data("insert into message_audio(message_audio_size,message_audio_duration,message_audio_url,message_audio_created_date,message_id,user_id) values(:message_audio_size,:message_audio_duration,:message_audio_url,:message_audio_created_date,:message_id,:user_id)", { message_audio_size, message_audio_duration, message_audio_url, message_audio_created_date, message_id, user_id });

        let message_audio_id = message_audio[0];

        res.send({ message_audio_id });

    } catch (error) {
        serverError(error, res);
    }
});

router.delete("/message_audio/:message_audio_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_audio_id = req.params.message_audio_id;

        await HelperFunction.delete_db_file("private/files", "message_audio", "message_audio_url", "message_audio_id", message_audio_id);

        await DB.post_data("delete from message_audio where message_audio_id=:message_audio_id and user_id=:user_id", { message_audio_id, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

router.get("/message_audio/:message_id", Security.authenticateToken, async (req, res) => {
    try {
        let message_id = req.params.message_id;
        let message_audios = await DB.get_data("select * from message_audio where message_id=:message_id", { message_id });
        res.send(message_audios);
    } catch (error) {
        serverError(error, res);
    }
})


module.exports = router;