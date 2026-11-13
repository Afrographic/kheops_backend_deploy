const Sequelize = require("sequelize");

class DB {
    static db;
    static init() {
        this.db = new Sequelize("monraa_wallet", "root", "", {
            host: "localhost",
            dialect: "mysql",
        });
        this.connect_db();
    }

    static async connect_db() {
        try {
            await this.db.authenticate();
            console.log(
                "Connection with the  database OK"
            );

        } catch (error) {
            console.error("Unable to connect to the  database:", error);
        }
    }

    static async get_data(query, replacements) {
        return await this.db.query(query, {
            replacements: replacements,
            type: "SELECT"
        })
    }

    static async post_data(query, replacements) {
        return await this.db.query(query, {
            replacements: replacements
        })
    }

    static async update_data(query, replacements) {
        return await this.db.query(query, {
            replacements: replacements
        })
    }

    static async delete_data(query, replacements) {
        return await this.db.query(query, {
            replacements: replacements
        })
    }
}


module.exports.DB = DB;