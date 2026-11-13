const express = require("express");
const { DB } = require("../db");
const { HelperFunction } = require("../tools/helper_function");
const { OwnerShipChecker } = require("../tools/ownership_checker");
const { Security } = require("../tools/security");
const { serverError } = require("../tools/serverError");
const { Validator } = require("../tools/validator");
const { Axios_Private } = require("../tools/axios");
const router = express.Router();

// Make payment request
router.post("/payment", async (req, res) => {
    try {
        let { payment_amount, user_address, payment_website } = req.body;
        let payment_created_date = new Date();
        let fields_ok = Validator.validateFields({ payment_amount, user_address, payment_website }, res);
        if (!fields_ok) {
            return;
        }

        if (payment_amount <= 0) {
            res.status(200).send({ status: 300, msg: "The amount must be greater than 0!" });
            return;
        }

        // check if there is a user with that address
        let user_exist = await check_if_user_exist(user_address);
        if (!user_exist) {
            res.status(200).send({ status: 301, msg: "There is no user with this address!" });
            return;
        }

        let user_balance = await get_user_balance(user_address);

        if (payment_amount > user_balance) {
            res.status(200).send({ status: 302, msg: "Solde insuffissant!" });
            return;
        }

        let payment = await DB.post_data("insert into payment(payment_amount,payment_website,user_address,payment_created_date) values(:payment_amount,:payment_website,:user_address,:payment_created_date)", { payment_amount, user_address, payment_website, payment_created_date });

        let payment_id = payment[0];

        res.send({ status: 200, payment_id: payment_id });
    } catch (error) { 
        serverError(error, res); 
    } 
})

async function check_if_user_exist(user_address) {
    let users = await DB.get_data("select user_id from user where user_address=:user_address", { user_address });
    return users.length > 0;
}

async function get_user_balance(user_address) {
    let users = await DB.get_data("select user_balance from user where user_address=:user_address", { user_address });
    if (users.length == 0) {
        return 0;
    }
    return users[0].user_balance;
}

// check if payment has been confirmed
router.get("/check_confirm_payment/:payment_id/:user_address", async (req, res) => {
    try {
        let payment_id = req.params.payment_id;
        let user_address = req.params.user_address;
        let payments = await DB.get_data("select  * from payment where payment_id=:payment_id and user_address=:user_address and payment_confirmed = 1", { payment_id, user_address });
        if (payments.length == 0) {
            res.send({ confirmed: false });
            return;
        }
        res.send({ confirmed: true })
    } catch (error) {
        serverError(error, res);
    }
})

// check if wallet address exist
router.get("/valid_wallet/:user_address", async (req, res) => {
    try {
        let user_address = req.params.user_address;
        let user_exist = await check_if_user_exist(user_address);
        res.send({ wallet_exist: user_exist });
    } catch (error) {
        serverError(error, res);
    }
})

// confirm payment
router.patch("/confirm_payment/:payment_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let payment_id = req.params.payment_id;
        let payment_amount = await get_payment_amount(payment_id);

        if (payment_amount == null) {
            res.sendStatus(401);
            return;
        }

        if (payment_amount == 0) {
            res.sendStatus(401);
            return;
        }

        let user_data = await get_user_data(user_id);
        let user_balance = user_data.user_balance;
        let user_address = user_data.user_address;


        // check if payment was already confirmed
        let axios_res = await Axios_Private.get_secure_data(`/check_confirm_payment/${payment_id}/${user_address}`);
        if (axios_res.confirmed) {
            res.sendStatus(401);
            return;
        }

        if (user_balance < payment_amount) {
            res.status(401).send("Votre solde est insufissant!");
            return;
        }

        let payment_confirmed_date = new Date();

        await DB.update_data("update payment set payment_confirmed=1,payment_confirmed_date=:payment_confirmed_date where user_address=:user_address and  payment_revoked = 0 and payment_id=:payment_id", { user_address, payment_id, payment_confirmed_date });

        await DB.update_data("update user set user_balance = user_balance - :payment_amount where user_id=:user_id", { user_id, payment_amount });

        res.sendStatus(200);

    } catch (error) {
        serverError(error, res);
    }
})


async function get_user_data(user_id) {
    let users = await DB.get_data("select user_balance,user_address from user where user_id=:user_id", { user_id });
    return users[0];
}

async function get_payment_amount(payment_id) {
    let payments = await DB.get_data("select payment_amount from payment where payment_id=:payment_id", { payment_id });
    if (payments.length == 0) {
        return null;
    }
    return payments[0].payment_amount;
}

// revoke payment
router.patch("/revoke_payment/:payment_id", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let payment_id = req.params.payment_id;
        let user_address = await get_user_address(user_id);
        if (user_address.trim().length == 0) {
            res.sendStatus(401);
            return;
        }
        payment_revoked_date = new Date();

        await DB.update_data("update payment set payment_revoked = 1,payment_revoked_date=:payment_revoked_date where payment_id=:payment_id and user_address=:user_address", { payment_id, user_address, payment_revoked_date });

        res.sendStatus(200);
    } catch (error) {
        serverError(error, res);
    }
})

async function get_user_address(user_id) {
    let users = await DB.get_data("Select user_address from user where user_id=:user_id", { user_id });
    if (users.length == 0) {
        return "";
    }
    return users[0].user_address;
}

// get user payments
router.get("/payments/user_address/:user_address/offset/:offset", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let offset = parseInt(req.params.offset);
        let user_address = req.params.user_address;
        let limit = 20; 

        let is_user_address = await check_if_is_user_address(user_address, user_id);

        if (!is_user_address) {
            res.sendStatus(401);
            return;
        }

        let payments = await DB.get_data("select * from payment where user_address=:user_address order by payment_id DESC limit :limit offset :offset", { limit, offset, user_address });

        for (const payment of payments) {
            let index = payments.indexOf(payment);
            payment.payment_created_date = HelperFunction.get_elapsed_time(payment.payment_created_date);
            payment.payment_confirmed_date = HelperFunction.get_elapsed_time(payment.payment_confirmed_date);
            payment.payment_revoked_date = HelperFunction.get_elapsed_time(payment.payment_revoked_date);
            payments[index] = payment;
        }

        res.send(payments);
    } catch (error) {
        serverError(error, res);
    }
})

// get user total payment
router.get("/total_payments/user_address/:user_address", Security.authenticateToken, async (req, res) => {
    try {
        let user_id = req.body.user_data.user_id;
        let user_address = req.params.user_address;

        let is_user_address = await check_if_is_user_address(user_address, user_id);

        if (!is_user_address) {
            res.sendStatus(401);
            return;
        }

        let total = await DB.get_data("select count(*) as total from payment where user_address=:user_address", { user_address });
        if (total.length == 0) {
            res.send({ total: 0 });
            return;
        }

        res.send({ total: total[0].total });
    } catch (error) {
        serverError(error, res);
    }
})

async function check_if_is_user_address(user_address, user_id) {
    let users = await DB.get_data("select * from user where user_id=:user_id and user_address=:user_address", { user_id, user_address });
    return users.length > 0;
}
module.exports = router;