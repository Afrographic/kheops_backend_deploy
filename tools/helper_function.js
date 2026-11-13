const gods = require("./egyptians_gods");
const crypto = require("crypto");
const { DB } = require("../db");
const fs = require("fs");
const uuid = require("uuid");

class HelperFunction {
    static generate_unique_id_from_time() {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDay();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        let milliseconds = date.getMilliseconds();
        return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
    }


    static Ucase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static removeUselessWhiteSpace(str) {
        return str.trim().replaceAll(/\s+/g, " ");
    }

    static remove_all_spaces(str) {
        return str.trim().replaceAll(/\s+/g, "");
    }

    static generate_address() {
        let uniqueString = crypto.randomBytes(36).toString('hex');
        let index1 = this.randomIntGenerator(gods.length - 1);
        let index2 = this.randomIntGenerator(gods.length - 1);
        return gods[index1] + uniqueString + gods[index2];
    }

    static randomIntGenerator(max) {
        return Math.floor(Math.random() * max);
    }

    static valid_phone(phone) {
        phone = this.remove_all_spaces(phone);
        let reg = new RegExp("^\\+[()0-9_-]{4,}$");
        return reg.test(phone);
    }

    static async get_admin_id(user_id) {
        let user = await DB.get_data("select admin_id from admin where user_id=:user_id", { user_id });
        return user[0].admin_id;
    }

    static async delete_db_file(root_folder, table_name, field_name, column_id, column_id_value) {
        let data = await DB.get_data(`SELECT ${field_name} from ${table_name} where ${column_id}=${column_id_value}`);
        if (data.length == 0) return;
        let file_name = data[0][`${field_name}`];
        let file_path = `${root_folder}/${file_name}`;
        try {
            fs.unlinkSync(file_path);
        } catch (e) {
            console.log(e);
        }
    }

    static generate_5_digit_code() {
        let user_activation_code = uuid.v1().toString().substring(0, 5).toUpperCase();
        return user_activation_code;
    }

    static add_hours(date, hours) {
        date.setHours(date.getHours() + hours);

        return date;
    }

    static async get_user_data_from_address(user_address) {
        let user_data = await DB.get_data('select user_id,user_username,user_email from user where user_address=:user_address ', { user_address });
        return user_data;
    }
    static async get_user_data_from_id(user_id) {
        let user_data = await DB.get_data('select user_id,user_username,user_email from user where user_id=:user_id ', { user_id });
        return user_data;
    }

    static get_elapsed_time(date_) {
        if (date_ == null) return null;
        let date = new Date(date_);

        //  for some reason i must add 1h to the current to meet the current time
        // will investigate this futher once deployed!
        let current_date = new Date();
        current_date = this.add_hours(current_date, 1);

        let diff = current_date.getTime() - date.getTime();
        let diff_days_raw = diff / (1000 * 60 * 60 * 24);


        let diff_days = Math.floor(diff_days_raw);
        let diff_hours = Math.floor(diff_days_raw * 24);
        let diff_minutes = Math.floor(diff_days_raw * 24 * 60)
        let diff_seconds = Math.floor(diff_days_raw * 24 * 60 * 60)


        if (diff_days == 0) {
            if (diff_hours == 0) {
                if (diff_minutes == 0) {
                    return `${diff_seconds} s`;
                } else {
                    return `${diff_minutes} min`;
                }
            } else {

                return `${diff_hours} h`;
            }
        } else {
            if (diff_days > 30) {
                if (diff_days > 365) {
                    if (Math.floor(diff_days / 365) == 1) {
                        return `1 an`

                    }
                    return `${Math.floor(diff_days / 365)} ans`
                } else {
                    if (Math.floor(diff_days / 30) == 1) {
                        return `${Math.floor(diff_days / 30)} mois`

                    }

                    return `${Math.floor(diff_days / 30)} mois`
                }
            } else {
                return `${diff_days} Jours`;
            }
        }


    }
}

module.exports.HelperFunction = HelperFunction;