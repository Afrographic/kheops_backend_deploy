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

// create the empty or not message row
//message_image_size
router.post("/message_image", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { message_id } = req.body;
        let message_image_desc = req.body.message_image_desc ?? "";
        let message_image_created_date = new Date();

        if (!Validator.validateFields({ message_id }, res)) {
            return;
        }

        if (!Validator.valid_image_upload(req)) {
            res.sendStatus(401);
            return;
        }

        let urls = HelperFile.upload_image(req.files.file);
        let message_image_url = urls.high_res;
        let message_image_low_url = urls.low_res;
        let message_image_size = req.files.file.size;


        let message_image = await DB.post_data("insert into message_image(message_image_url,message_image_size,message_image_low_url,message_image_desc,message_image_created_date,message_id,user_id) values(:message_image_url,:message_image_size,:message_image_low_url,:message_image_desc,:message_image_created_date,:message_id,:user_id)", {
            message_image_url, message_image_size, message_image_low_url, message_image_desc, message_image_created_date, message_id, user_id
        });

        let message_image_id = message_image[0]

        res.send({ message_image_id });
    } catch (error) {
        serverError(error, res);
    }
});

//edit image description
router.patch("/description/message_image/:message_image_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_image_id = req.params.message_image_id;
        let message_image_desc = req.body.message_image_desc ?? "";

        await DB.update_data("update message_image set message_image_desc=:message_image_desc where message_image_id=:message_image_id and user_id=:user_id", { message_image_desc, message_image_id, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

// delete image
router.delete("/message_image/:message_image_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let message_image_id = req.params.message_image_id;

        await delete_message_image_file(message_image_id);
        await DB.delete_data("delete from message_image where message_image_id=:message_image_id and user_id=:user_id", { message_image_id, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
});

async function delete_message_image_file(message_image_id) {
    let images = await DB.get_data('select * from message_image where message_image_id=:message_image_id', { message_image_id });
    let url = images[0].message_image_low_url;
    HelperFile.remove_file(`private/image_thumbnails/${url}`)
    HelperFile.remove_file(`private/images/${url}`)
}

// get the images of a message
router.get("/message_image/:message_id", Security.authenticateToken, async (req, res) => {
    try {
        let message_id = req.params.message_id;
        let message_images = await DB.get_data('select * from message_image where message_id=:message_id', { message_id });
        res.send(message_images);
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;