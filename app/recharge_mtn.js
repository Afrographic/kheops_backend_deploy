const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();


router.post("/recharge_mtn", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { user_mtn_id, admin_mtn_id, recharge_id, admin_id } = req.body;
        let fields_ok = Validator.validateFields({ user_mtn_id, admin_mtn_id, recharge_id, admin_id }, res);
        if (!fields_ok) {
            return;
        }

        if (!(await OwnerShipChecker.is_good_recharge_type(recharge_id, user_id, admin_id))) {
            res.sendStatus(401);
            return;
        }

        await DB.post_data("insert into recharge_mtn(recharge_id,user_mtn_id,admin_mtn_id) values(:recharge_id,:user_mtn_id,:admin_mtn_id)", { recharge_id, user_mtn_id, admin_mtn_id });

        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})

// determine if it is mtn recharge
router.get("/is_mtn_recharge/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let recharge_id = req.params.recharge_id;


        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }

        let recharges = await DB.get_data("select * from recharge_mtn where recharge_id=:recharge_id", { recharge_id });
        res.send({ is_mtn_recharge: recharges.length > 0 });

    } catch (error) {
        serverError(error, res);
    }
})

// get mtn client account
router.get("/client_mtn/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }
        let mtns = await DB.get_data("select mtn.* from mtn,recharge_mtn where recharge_id=:recharge_id and user_mtn_id=mtn_id",{recharge_id});
        res.send({ mtn: mtns[0] })
    } catch (error) {
        serverError(error, res);
    }
})

// get mtn admin account
router.get("/admin_mtn/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }
        let mtns = await DB.get_data("select mtn.* from mtn,recharge_mtn where recharge_id=:recharge_id and admin_mtn_id=mtn_id", { recharge_id });
        res.send({ mtn: mtns[0] })
    } catch (error) {
        serverError(error, res);
    }
})


module.exports = router;