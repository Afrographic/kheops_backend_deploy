
const nodemailer = require('nodemailer');

class EmailService {
    static transporter;
    static init() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: `${process.env.email_service_email}`,
                pass: `${process.env.email_service_password}`,
            },
        });

        this.transporter.verify().then(console.log).catch(console.error);
    }

    static async send_account_activation_code(username, email, code) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
                  <h1>${code}</h1>
                  <p>est le code de verification de votre compte sur Monraa Wallet</p>
                </div>
                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Account verification", // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }


    static async send_password_reset_link(username, email, reset_password_link) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
                  <p>Cliquez sur le lien ci dessous pour reinitialiser votre mot de passe</p>

                  <a href="${reset_password_link}" style='text-decoration:none;' >
                    <div style="box-sizing:border-box;background-color:#00145A;color:white;padding:16px;border-radius:8px;margin:8px 0px;width:100%;text-align:center;">
                        Reinitialiser mon mot de passe
                    </div>
                
                  </a>
                  <div style="margin-top:16px;border:1px solid red;color:red;padding:16px;border-radius:8px;text-align:center;margin:8px 0px;">Ce lien expire dans 10 minutes</div>
                </div>
                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Changement de mot de passe", // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }

    static async send_login_code(username, user_email, code) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
                  <h1>${code}</h1>
                  <p>est le code de verification pour l'acces a votre wallet!</p>
                </div>
                <p style="color:grey;">Si vous n'avez pas effectuer cette demande, veuillez ignorez cette email et votre compte restera securise!</p>
                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: user_email, // list of receivers
                subject: "Confirmation de Login", // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }

    static async notify_recharge(username, user_email, amount) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
               
                  <p>Vous avez une recharge de </p>
                     <h1>${amount} F</h1>
                  <p> a traiter</p>
                </div>

                <a href="http://wallet.monraa.com">
                  <div style="margin-top:16px;text-align:center;color:white;padding:16px;border-radius:12px;background-color:#E65035;">
                   Traiter la recharge                
                  </div>
                </a>

                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: user_email, // list of receivers
                subject: `Confirmation de Recharge ${amount} FCFA`, // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }

    static async notify_account_credited(username, user_email, amount) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
               
                  <p>Votre compte a ete crediter de </p>
                     <h1>${amount} F</h1>
                
                </div>

                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: user_email, // list of receivers
                subject: `Recharge de ${amount} FCFA confirme!`, // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }

    static async notify_recharge_rejected(username, user_email, amount) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
               
                  <p>Votre recharge de ${amount} F a ete rejetee </p>
                                  
                </div>

                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: user_email, // list of receivers
                subject: `Recharge de ${amount} FCFA Rejetee!`, // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }




    static async notify_banish_admin(username, user_email) {
        try {
            let body = `
                <div style="padding:18px;border:1px solid rgba(170, 170, 170, 0.616);border-radius:12px;">
                  <p>Hi ${username},</p>
               
                  <p>Vous avez ete demis de vos fonctions d'adminstrateur </p>
                <p>Monraa vous remercie pour les services rendus.</p>
                
                </div>

                <div style="font-size:11px;margin-top:32px;padding:16px;text-align:center"> 
                    <table width="100%">
                        <tr>
                            <td>
                                 <img src="cid:monraa_logo" width="25px">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 From <b>MonRaa</b> 
                            </td>
                        </tr>
                    </table>
                    
                    
                </div>
                `;
            this.transporter.sendMail({
                from: '"Monraa Wallet" <monraa.tech@gmail.com>', // sender address
                to: user_email, // list of receivers
                subject: `Licenciement`, // Subject line
                attachments: [{
                    filename: 'monraa_logo.png',
                    path: __dirname + '/../public/images/monraa_logo.png',
                    cid: 'monraa_logo'
                }],
                html: body, // html body
            }).then(info => {
                console.log({ info });
            }).catch(console.error);

        } catch (error) {
            console.log(error)
        }

    }


}


module.exports.EmailService = EmailService;