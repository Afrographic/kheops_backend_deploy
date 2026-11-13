const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const router = express.Router();


// determine is a user is a top admin
router.get("/is_top_admin", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let users = await DB.get_data("select * from top_admin where user_id=:user_id", { user_id });
        res.send({ is_top_admin: users.length > 0 });
    } catch (error) {
        serverError(error, res);
    }
})

// ban  a user
router.patch("/ban", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let ban_id = req.body.ban_id ?? "";
        if (ban_id.trim().length == 0) {
            res.sendStatus(400);
            return;
        }
        let lol = await DB.update_data("update user set user_is_banned = 1 where user_email=:ban_id or user_username=:ban_id or user_address=:ban_id", { ban_id });

        if (lol[0].affectedRows == 0) {
            return res.send({ status: 300 });
        }
        res.send({ status: 200 });
    } catch (error) {
        serverError(error, res); 
    }
})


// Create an admin
router.post("/admin", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        
        let user_address = req.body.user_address ?? "";
        if (user_address.trim().length == 0) {
            res.sendStatus(401);
            return;
        }

        let user_data = await HelperFunction.get_user_data_from_address(user_address);
        if (user_data.length == 0) {
            res.send({ status:401});
            return;
        }

        let user_id = user_data[0].user_id;
        let admin_created_date = new Date();

        await DB.post_data("INSERT INTO admin(admin_created_date,user_id) VALUES(:admin_created_date,:user_id)", {
            admin_created_date, user_id
        })
        res.send({ status: 200 });
    } catch (error) {
        serverError(error, res);
    }
})


// get total admins
router.get("/total_admin", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let total = await DB.get_data('select count(*) as total from admin where admin_banned = 0');
        if (total.length == 0) {
            res.send({ total: 0 });
            return;
        }
        res.send({ total: total[0].total });
    } catch (error) {
        serverError(error, res);
    }
})

// get admins
router.get("/admins/offset/:offset", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let offset = parseInt(req.params.offset);
        let limit = 10;
        let admins = await DB.get_data("select admin.*,user_username from user,admin where admin.user_id=user.user_id and admin_banned = 0 order by admin_id DESC limit :limit offset :offset", { limit, offset });
        res.send(admins);
    } catch (error) {
        serverError(error, res);
    }
});

router.get("/single_admin", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let admins = await DB.get_data("select admin.*,user_username from user,admin where admin.user_id=user.user_id and admin.user_id = :user_id", { user_id });
        res.send(admins);
    } catch (error) {
        serverError(error, res);
    }
})


// get admin total recharge
router.get("/total_recharge/:user_id", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let user_id = req.params.user_id;
        let total = await DB.get_data("select SUM(recharge_amount) as total from recharge where admin_user_id=:user_id and recharge_confirmed=1", { user_id });
        res.send({ total: total[0].total });
    } catch (error) {
        serverError(error, res);
    }
});

// mark when admin pay to the company
router.patch("/paid_company/:user_id", [Security.authenticateToken, Security.is_top_admin], async (req, res) => {
    try {
        let user_id = req.params.user_id;
        await DB.update_data("update admin set admin_amount_to_pay = 0 , admin_balance = 0 where user_id=:user_id", { user_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})



module.exports = router;