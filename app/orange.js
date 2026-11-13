const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();

router.post("/orange", Security.authenticateToken, async (req, res) => {
    try {
        let { orange_name, orange_number } = req.body;
        let orange_created_date = new Date();
        let user_id = req.body.user_data.user_id;
        let fields_ok = Validator.validateFields({ orange_name, orange_number }, res);
        if (!fields_ok) {
            return;
        }

        if (!(orange_number.trim().length >0 && orange_number.trim().length<=15)) {
            res.status(400).send({
                msg:"The phone number is incorrect"
            })
        }

        if (!HelperFunction.valid_phone(orange_number)) {
            res.statusCode(400);
            res.send({
                msg:"The phone number is incorrect"
            })
        }

        orange_name = HelperFunction.Ucase(orange_name);
        await DB.post_data("INSERT INTO orange(orange_name,orange_number,orange_created_date,user_id) VALUES(:orange_name,:orange_number,:orange_created_date,:user_id)", { orange_name, orange_number, orange_created_date, user_id });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})



// Edit of the name
router.patch("/name/orange/:orange_id", Security.authenticateToken, async (req, res) => {
    try {
        let orange_id = req.params.orange_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_orange_owner(orange_id, user_id))) {
            res.sendStatus(403);
            return;
        }

        let { orange_name } = req.body;
        if (!Validator.validateFields({ orange_name }, res)) {
            return;
        }

        orange_name = HelperFunction.Ucase(orange_name);
        
        await DB.update_data("update orange set orange_name=:orange_name WHERE orange_id=:orange_id", { orange_name, orange_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Edit of the number
router.patch("/number/orange/:orange_id", Security.authenticateToken, async (req, res) => {
    try {
        let orange_id = req.params.orange_id;
        let user_id = req.body.user_data.user_id;


        if (!(await OwnerShipChecker.is_orange_owner(orange_id, user_id))) {
            res.sendStatus(403);
            return;
        }
        
        let { orange_number } = req.body;
        orange_number = orange_number ?? "";
        if (!HelperFunction.valid_phone(orange_number)) {
            res.statusCode(400);
            res.send({
                msg: "The phone number is incorrect"
            })
        }
        await DB.update_data("update orange set orange_number=:orange_number WHERE orange_id=:orange_id", { orange_number,orange_id });
        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// Delete of the orange data
router.delete("/orange/:orange_id", Security.authenticateToken, async (req, res) => {
    try {
        let orange_id = req.params.orange_id;
        let user_id = req.body.user_data.user_id;

        if (!OwnerShipChecker.is_orange_owner(orange_id, user_id)) {
            res.sendStatus(403);
            return;
        }

        await DB.delete_data("delete from orange where orange_id=:orange_id", { orange_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

// get the orange data of a user
router.get("/orange/user/:user_id", async (req, res) => {
    try {
        let user_id = req.params.user_id;
        let orange_data = await DB.get_data("SELECT * FROM orange WHERE user_id=:user_id order by orange_id DESC", { user_id });
        res.status(200).send(orange_data);
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;