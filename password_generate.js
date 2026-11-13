const { Security } = require("./tools/security");

function generate_password() {
    console.log(Security.encryptPassword("gyi7965789!2hg"));
}

generate_password();