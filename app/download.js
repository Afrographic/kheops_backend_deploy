const express = require("express");
const router = express.Router();
const { serverError } = require("./../tools/serverError");
const { Security } = require("../tools/security");

router.get("/download_image/name/:name", Security.authenticateToken, async (req, res) => {
    try {
        let file_name = req.params.name;
        let file_path = `private/images/${file_name}`;
        res.download(file_path, file_name)
    } catch (e) {
        serverError(e, res);
    }

})

router.get("/download_image_thumbnail/name/:name", Security.authenticateToken, async (req, res) => {
    try {
        let file_name = req.params.name;
        let file_path = `private/image_thumbnails/${file_name}`; 
        res.download(file_path, file_name)
    } catch (e) {
        serverError(e, res);
    }

})

router.get("/download_audio/name/:name", Security.authenticateToken, async (req, res) => {
    try {
        let file_name = req.params.name;
        let file_path = `private/files/${file_name}`; 
        res.download(file_path, file_name)
    } catch (e) {
        serverError(e, res);
    }

})


module.exports = router;