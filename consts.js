
class Consts {
    static HOST = "http://localhost";
    static HOST_NAME = "localhost";
    static PORT = process.env.PORT || 3010;
    static user_avatar = `${this.HOST}:${this.PORT}/images/default_avatar.svg`;
}

module.exports.Consts = Consts;