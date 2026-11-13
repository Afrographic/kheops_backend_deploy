const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();

router.post("/mtn", Security.authenticateToken, async (req, res) => {
    try {
        let { mtn_name, mtn_number } = req.body;
        let mtn_created_date = new Date();
        let user_id = req.body.user_data.user_id;
        let fields_ok = Validator.validateFields({ mtn_name, mtn_number }, res);
        if (!fields_ok) {
            return;
        }


        if (!HelperFunction.valid_phone(mtn_number)) {
          
            res.status(400).send({
                msg: "The phone number is incorrect"
            })
        }

        mtn_name = HelperFunction.Ucase(mtn_name);
        await DB.post_data("INSERT INTO mtn(mtn_name,mtn_number,mtn_created_date,user_id) VALUES(:mtn_name,:mtn_number,:mtn_created_date,:user_id)", { mtn_name, mtn_number, mtn_created_date, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})



// Edit of the name
router.patch("/name/mtn/:mtn_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let mtn_id = req.params.mtn_id;

        if (!(await OwnerShipChecker.is_mtn_owner(mtn_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { mtn_name } = req.body;
        if (!Validator.validateFields({ mtn_name }, res)) {
            return;
        }

        mtn_name = HelperFunction.Ucase(mtn_name);

        await DB.update_data("update mtn set mtn_name=:mtn_name WHERE mtn_id=:mtn_id", { mtn_name, mtn_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Edit of the number
router.patch("/number/mtn/:mtn_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let mtn_id = req.params.mtn_id;

        if (!(await OwnerShipChecker.is_mtn_owner(mtn_id, user_id))) {
            res.sendStatus(403);
            return;
        }
        
        let { mtn_number } = req.body;
        mtn_number = mtn_number ?? "";
        if (!HelperFunction.valid_phone(mtn_number)) {
            res.statusCode(400);
            res.send({
                msg: "The phone number is incorrect"
            })
        }
        await DB.update_data("update mtn set mtn_number=:mtn_number WHERE mtn_id=:mtn_id", { mtn_number, mtn_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Delete of the mtn data
router.delete("/mtn/:mtn_id", Security.authenticateToken, async (req, res) => {
    try {
        let mtn_id = req.params.mtn_id;
        let user_id = req.body.user_data.user_id;

        if (!OwnerShipChecker.is_mtn_owner(mtn_id, user_id)) {
            res.sendStatus(403);
            return;
        }

        await DB.delete_data("delete from mtn where mtn_id=:mtn_id", { mtn_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})


// get the mtn data of a user
router.get("/mtn/user/:user_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.params.user_id;
        let mtn_data = await DB.get_data("SELECT * FROM mtn WHERE user_id=:user_id order by mtn_id DESC", { user_id });
        res.status(200).send(mtn_data);
    } catch (error) {
        serverError(error, res);
    }
})

module.exports = router;