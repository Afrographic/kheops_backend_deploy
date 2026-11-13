require("dotenv").config();
const express = require("express");
const cors = require('cors');
const app = express();
const http = require("http").createServer(app);
const fileUpload = require("express-fileupload");
const path = require("path");
const { Consts } = require("./consts.js");
const { EmailService } = require("./tools/emailService.js");
const { DB } = require("./db.js");
const Socket_Service = require("./tools/socket.service.js");

// init the static folder
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // to support JSON-encoded bodies
app.use(fileUpload());
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(cors());

// Security layer 
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST,DELETE,PATCH ");
    next();
});

// configuring real time server
const io = require("socket.io")(http, {
    cors: {
        origin: `${Consts.HOST}:4200`,
        methods: ["GET", "POST"],
    }
});


// adding the router
app.use("/api", require("./app/user"));
app.use("/api", require("./app/user_edit"));
app.use("/api", require("./app/user_activation"));
app.use("/api", require("./app/user_update_password"));
app.use("/api", require("./app/orange"));
app.use("/api", require("./app/mtn"));
app.use("/api", require("./app/crypto"));
app.use("/api", require("./app/admin"));
app.use("/api", require("./app/recharge"));
app.use("/api", require("./app/recharge_mtn"));
app.use("/api", require("./app/recharge_orange"));
app.use("/api", require("./app/recharge_crypto"));
app.use("/api", require("./app/message"));
app.use("/api", require("./app/message_image"));
app.use("/api", require("./app/message_audio"));
app.use("/api", require("./app/download"));
app.use("/api", require("./app/payment"));
app.use("/api", require("./app/top_admin"));

http.listen(Consts.PORT, Consts.HOST_NAME, () => console.log(`App is listening on port ${Consts.PORT}.`));
DB.init();
EmailService.init();  
Socket_Service.init(io); 





 


