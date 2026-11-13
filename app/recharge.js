const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const { EmailService } = require("../tools/emailService");
const router = express.Router();


// Place recharge token
router.post("/recharge", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let { recharge_amount, admin_user_id } = req.body;
        let recharge_created_date = new Date();
        let fields_ok = Validator.validateFields({ recharge_amount, admin_user_id }, res);
        if (!fields_ok) {
            return;
        }

        let recharge = await DB.post_data("INSERT INTO recharge(recharge_amount,user_id,admin_user_id,recharge_created_date) values (:recharge_amount,:user_id,:admin_user_id,:recharge_created_date)", { recharge_amount, user_id, admin_user_id, recharge_created_date });

        let recharge_id = recharge[0];
        // create the chat instance
        let chat_id = await create_chat_instance(recharge_id);
        // send email to admin to notify him
        notify_admin(recharge_amount, admin_user_id);

        res.send({ recharge_id, chat_id });

    } catch (error) {
        serverError(error, res);
    }
})

async function notify_admin(recharge_amount, user_id) {
    let admin_data = await get_admin_data(user_id);
    let user_email = admin_data.user_email;
    let user_username = admin_data.user_username;
    EmailService.notify_recharge(user_username, user_email, recharge_amount);
}

async function get_admin_data(user_id) {
    let users = await DB.get_data("select user_username,user_email from user where user_id=:user_id", { user_id });
    return users[0];
}

async function create_chat_instance(recharge_id) {
    let chat_created_date = new Date();
    let chat = await DB.post_data("insert into chat(chat_created_date,recharge_id) values(:chat_created_date,:recharge_id)", { chat_created_date, recharge_id })
    return chat[0];
}

// reject a recharge
router.patch("/reject_recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_recharge_admin_owner(recharge_id, user_id))) {
            res.sendStatus(401);
            return;
        }

        await DB.update_data("UPDATE recharge set recharge_rejected = 1 where recharge_id=:recharge_id", { recharge_id });
        // close the chat
        await close_chat(recharge_id);
        // notify client for the rejection
        let client_id = await get_recharge_client_id(recharge_id);
        let amount = await get_recharge_data(client_id, recharge_id);
        notify_client_reject(client_id, amount);

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

async function get_recharge_client_id(recharge_id) {
    let users = await DB.get_data("select user_id from recharge where recharge_id=:recharge_id", { recharge_id });
    return users[0].user_id;
}

async function notify_client_reject(user_id, amount) {
    let user_data = await get_client_data(user_id);
    let user_email = user_data.user_email;
    let user_username = user_data.user_username;
    EmailService.notify_recharge_rejected(user_username, user_email, amount);
}

//mark recharge as paid
router.patch("/mark_paid/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let recharge_id = req.params.recharge_id;
        await DB.update_data("update recharge set recharge_paid=1 where recharge_id=:recharge_id and user_id=:user_id", { recharge_id, user_id });
        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})


// confirm a recharge
router.patch("/confirm_recharge/client/:client_id/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let recharge_id = req.params.recharge_id;
        let client_id = req.params.client_id;
        let user_id = req.body.user_data.user_id;

        if (!(await OwnerShipChecker.is_recharge_owner(recharge_id, client_id))) {
            res.sendStatus(401);
            return;
        }

        if (!(await OwnerShipChecker.is_recharge_admin_owner(recharge_id, user_id))) {
            res.sendStatus(401);
            return;
        }

        let amount = await get_recharge_data(client_id, recharge_id);
        await DB.update_data("UPDATE recharge set recharge_confirmed = 1 where recharge_id=:recharge_id", { recharge_id });
        // Increment the user account
        await DB.update_data("update user set user_balance=user_balance + :amount where user_id=:client_id", { amount, client_id });
        // close the chat
        await close_chat(recharge_id);

        // update admin metrics
        await update_admin_metrics(amount, user_id);

        await notify_client(client_id, amount);

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

async function update_admin_metrics(amount, user_id) {
    let admin_balance = amount * 5 / 100;
    let admin_amount_to_pay = amount * 95 / 100;
    await DB.update_data("Update admin set admin_balance=:admin_balance , admin_amount_to_pay=:admin_amount_to_pay where user_id = :user_id", { admin_balance, admin_amount_to_pay, user_id });
}

async function notify_client(user_id, amount) {
    let user_data = await get_client_data(user_id);
    let user_email = user_data.user_email;
    let user_username = user_data.user_username;
    EmailService.notify_account_credited(user_username, user_email, amount);
}

async function get_client_data(user_id) {
    let users = await DB.get_data("select user_username,user_email from user where user_id=:user_id", { user_id });
    return users[0];
}

async function get_recharge_data(user_id, recharge_id) {
    let data = await DB.get_data("SELECT recharge_amount FROM recharge WHERE recharge_id=:recharge_id and user_id=:user_id", { recharge_id, user_id });
    return data[0].recharge_amount;
}

async function close_chat(recharge_id) {
    await DB.update_data("update chat set chat_closed = 1 where recharge_id=:recharge_id", { recharge_id });
}

// get a recharge request of an admin
router.get("/recharge", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        if (!(await OwnerShipChecker.is_admin(user_id))) {
            res.sendStatus(401);
            return;
        }
        let recharges = await DB.get_data("SELECT * from recharge WHERE admin_id=:user_id", { user_id })
        res.send(recharges);
    } catch (error) {
        serverError(error, res);
    }
})

// get recharges of a user
router.get("/recharge/user/:offset", Security.authenticateToken, async (req, res) => {
    try {
        let offset = parseInt(req.params.offset);
        let limit = 20;
        let user_id = req.body.user_data.user_id;
        let recharges = await DB.get_data("SELECT user_username,recharge.* from recharge,user WHERE recharge.user_id=:user_id and recharge.user_id = user.user_id order by recharge_id DESC  limit :limit offset :offset", { user_id, offset, limit });

        for (const recharge of recharges) {
            let index = recharges.indexOf(recharge);
            recharge.elapsed_time = HelperFunction.get_elapsed_time(recharge.recharge_created_date);
            recharges[index] = recharge;
        }

        res.send(recharges);
    } catch (error) {
        serverError(error, res);
    }
})

// get recharges of an admin
router.get("/admin_recharge/:offset", Security.authenticateToken, async (req, res) => {
    try {
        let offset = parseInt(req.params.offset);
        let limit = 20;
        let user_id = req.body.user_data.user_id;
        let recharges = await DB.get_data("SELECT user_username,recharge.* from recharge,user WHERE admin_user_id=:user_id and recharge.user_id = user.user_id order by recharge_id DESC  limit :limit offset :offset", { user_id, offset, limit })
        for (const recharge of recharges) {
            let index = recharges.indexOf(recharge);
            recharge.elapsed_time = HelperFunction.get_elapsed_time(recharge.recharge_created_date);
            recharges[index] = recharge;
        }
        res.send(recharges);
    } catch (error) {
        serverError(error, res);
    }
})

// get total recharge of user
router.get("/total_recharge", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let total = await DB.get_data("SELECT count(*) as total from recharge WHERE user_id=:user_id", { user_id })
        res.send({ total: total[0].total });
    } catch (error) {
        serverError(error, res);
    }
})

// get total recharge of an admin
router.get("/admin_total_recharge", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let total = await DB.get_data("SELECT count(*) as total from recharge WHERE admin_user_id=:user_id", { user_id })
        res.send({ total: total[0].total });
    } catch (error) {
        serverError(error, res);
    }
})
// get a recharge request of a user
router.get("/recharge/admin", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let recharges = await DB.get_data("SELECT * from recharge WHERE admin_user_id=:user_id", { user_id })
        res.send(recharges);
    } catch (error) {
        serverError(error, res);
    }
})

// get recharge chat_id
router.get("/recharge_chat_id/recharge/:recharge_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let recharge_id = req.params.recharge_id;

        if (!(await OwnerShipChecker.is_concerned_by_recharge(user_id, recharge_id))) {
            res.sendStatus(401);
            return;
        }

        let chat = await DB.get_data("select chat_id from chat where recharge_id=:recharge_id", { recharge_id });
        if (chat.length == 0) {
            res.sendStatus(404);
            return;
        }
        res.send({ chat_id: chat[0].chat_id })
    } catch (error) {
        serverError(error, res);
    }
})


module.exports = router;