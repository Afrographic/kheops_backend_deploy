const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();

router.post("/recharge_orange", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { user_orange_id, admin_orange_id, recharge_id, admin_id } = req.body;
        let fields_ok = Validator.validateFields({ user_orange_id, admin_orange_id, recharge_id, admin_id }, res);
        if (!fields_ok) {
            return;
        }

        if (!(await OwnerShipChecker.is_good_recharge_type(recharge_id, user_id, admin_id))) {
            res.sendStatus(401);
            return;
        }

        await DB.post_data("insert into recharge_orange(recharge_id,user_orange_id,admin_orange_id) values(:recharge_id,:user_orange_id,:admin_orange_id)", { recharge_id, user_orange_id, admin_orange_id });

        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})


// determine if it is orange recharge
router.get("/is_orange_recharge/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { recharge_id } = req.params;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }

        let recharges = await DB.get_data("select * from recharge_orange where recharge_id=:recharge_id", { recharge_id });
        res.send({ is_orange_recharge: recharges.length > 0 });

    } catch (error) {
        serverError(error, res);
    }
})


// get orange client account
router.get("/client_orange/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }
        let oranges = await DB.get_data("select orange.* from orange,recharge_orange where recharge_id=:recharge_id and user_orange_id=orange_id", { recharge_id });
        res.send({ orange: oranges[0] })
    } catch (error) {
        serverError(error, res);
    }
})

// get orange admin account
router.get("/admin_orange/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }
        let oranges = await DB.get_data("select orange.* from orange,recharge_orange where recharge_id=:recharge_id and admin_orange_id=orange_id", { recharge_id });
        res.send({ orange: oranges[0] })
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;