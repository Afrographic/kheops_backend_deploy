const { DB } = require("../db");

class OwnerShipChecker {
    static async check(table_name, field_id, user_id) {
        let res = await DB.get_data(`SELECT * FROM ${table_name} WHERE  ${table_name}_id = :field_id AND user_id=:user_id `, { field_id, user_id });
        return res.length > 0;
    }

    
    static async is_orange_owner(orange_id, user_id) {
        let res = await DB.get_data("select * from orange where orange_id=:orange_id AND user_id=:user_id", { orange_id, user_id });
        return res.length > 0
    }

    static async is_mtn_owner(mtn_id, user_id) {
        let res = await DB.get_data("select * from mtn where mtn_id=:mtn_id AND user_id=:user_id", { mtn_id, user_id });
        return res.length > 0
    }
    static async is_message_owner(message_id, user_id) {
        let res = await DB.get_data("select * from message where message_id=:message_id AND user_id=:user_id", { message_id, user_id });
        return res.length > 0
    }

    static async is_crypto_owner(crypto_id, user_id) {
        let res = await DB.get_data("select * from crypto where crypto_id=:crypto_id AND user_id=:user_id", { crypto_id, user_id });
        return res.length > 0
    }
    static async is_super_admin(user_id) {
        let res = await DB.get_data("SELECT * FROM super_admin WHERE user_id =:user_id", { user_id });
        return res.length > 0;
    }

    static async is_admin(user_id) {
        let res = await DB.get_data("SELECT * FROM admin WHERE user_id =:user_id", { user_id });
        return res.length > 0;
    }

    // MTN recharge ownerships checking
    static async mtn_belong_to_user(mtn_id, user_id) {
        let res = await DB.get_data("SELECT * FROM mtn WHERE mtn_id = :mtn_id and user_id =:user_id", { mtn_id, user_id });
        return res.length > 0;
    }

    static async is_recharge_admin_owner(recharge_id, admin_id) {
        let res = await DB.get_data("SELECT * FROM recharge WHERE recharge_id = :recharge_id and admin_user_id =:admin_id", { recharge_id, admin_id });
        return res.length > 0;
    }

    static async is_recharge_owner(recharge_id, user_id) {
        let res = await DB.get_data("SELECT * FROM recharge WHERE recharge_id = :recharge_id and user_id =:user_id", { recharge_id, user_id });
        return res.length > 0;
    }

    // Orange recharge ownerships checking
    static async orange_belong_to_user(orange_id, user_id) {
        let res = await DB.get_data("SELECT * FROM orange WHERE orange_id = :orange_id and user_id =:user_id", { orange_id, user_id });
        return res.length > 0;
    }

    // Crypto recharge ownerships checking
    static async crypto_belong_to_user(crypto_id, user_id) {
        let res = await DB.get_data("SELECT * FROM crypto WHERE crypto_id = :crypto_id and user_id =:user_id", { crypto_id, user_id });
        return res.length > 0;
    }

    static async is_good_recharge_type(recharge_id, user_id, admin_id) {
        let res = await DB.get_data("select * from recharge where recharge_id=:recharge_id and user_id=:user_id and admin_user_id=:admin_id", { recharge_id, user_id, admin_id });
        return res.length > 0;
    }

    static async is_concerned_by_recharge(user_id, recharge_id) {
        let res = await DB.get_data("select * from recharge where recharge_id=:recharge_id and user_id=:user_id or admin_user_id=:user_id", { recharge_id, user_id });
        return res.length > 0;
    }

}

module.exports.OwnerShipChecker = OwnerShipChecker;