const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();

router.post("/crypto", Security.authenticateToken, async (req, res) => {
    try {
        let { crypto_app_name, crypto_name, crypto_address } = req.body;
        let crypto_created_date = new Date();
        let user_id = req.body.user_data.user_id;
        let fields_ok = Validator.validateFields({ crypto_app_name, crypto_name, crypto_address }, res);
        if (!fields_ok) {
            return;
        }

        crypto_name = crypto_name.toUpperCase();
        crypto_app_name = HelperFunction.Ucase(crypto_app_name.trim());
        crypto_address = crypto_address.trim();

        await DB.post_data("INSERT INTO crypto(crypto_app_name,crypto_name,crypto_address,crypto_created_date,user_id) VALUES(:crypto_app_name,:crypto_name,:crypto_address,:crypto_created_date,:user_id)", { crypto_app_name, crypto_name, crypto_address, crypto_created_date, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})



// Edit of the name
router.patch("/name/crypto/:crypto_id", Security.authenticateToken, async (req, res) => {
    try {
        let crypto_id = req.params.crypto_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_crypto_owner(crypto_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { crypto_name } = req.body;
        if (!Validator.validateFields({ crypto_name }, res)) {
            return;
        }

        crypto_name = crypto_name.toUpperCase();

        await DB.update_data("update crypto set crypto_name=:crypto_name WHERE crypto_id=:crypto_id", { crypto_name, crypto_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Edit blockchain
router.patch("/address/crypto/:crypto_id", Security.authenticateToken, async (req, res) => {
    try {
        let crypto_id = req.params.crypto_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_crypto_owner(crypto_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { crypto_address } = req.body;
        let field_ok = Validator.validateFields({ crypto_address }, res);
        if (!field_ok) {
            return;
        }

        crypto_address = crypto_address.trim();

        await DB.update_data("update crypto set crypto_address=:crypto_address WHERE crypto_id=:crypto_id", { crypto_address, crypto_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})


// Edit of the address
router.patch("/blockchain/crypto/:crypto_id", Security.authenticateToken, async (req, res) => {
    try {
        let crypto_id = req.params.crypto_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_crypto_owner(crypto_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { crypto_blockchain } = req.body;
        let field_ok = Validator.validateFields({ crypto_blockchain }, res);
        if (!field_ok) {
            return;
        }

        crypto_blockchain = crypto_blockchain.toUpperCase();

        await DB.update_data("update crypto set crypto_blockchain=:crypto_blockchain WHERE crypto_id=:crypto_id", { crypto_blockchain, crypto_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})


// Edit of the app name
router.patch("/app_name/crypto/:crypto_id", Security.authenticateToken, async (req, res) => {

    try {
        let crypto_id = req.params.crypto_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_crypto_owner(crypto_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { crypto_app_name } = req.body;
        let field_ok = Validator.validateFields({ crypto_app_name }, res);
        if (!field_ok) {
            return;
        }

        crypto_app_name = HelperFunction.Ucase(crypto_app_name.trim())

        await DB.update_data("update crypto set crypto_app_name=:crypto_app_name WHERE crypto_id=:crypto_id", { crypto_app_name, crypto_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Delete of the crypto data
router.delete("/crypto/:crypto_id", Security.authenticateToken, async (req, res) => {
    try {
        let crypto_id = req.params.crypto_id;
        let user_id = req.body.user_data.user_id;

        await DB.delete_data("delete from crypto where crypto_id=:crypto_id and user_id=:user_id", { crypto_id, user_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

// get the crypto data of a user
router.get("/crypto/user/:user_id", async (req, res) => {
    try {
        let user_id = req.params.user_id;
        let crypto_data = await DB.get_data("SELECT * FROM crypto WHERE user_id=:user_id order by crypto_id DESC", { user_id });
        res.status(200).send(crypto_data);
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;