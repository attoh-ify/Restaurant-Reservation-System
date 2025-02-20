const nodeMailer = require("nodemailer");

const emailAddress = process.env.EMAIL_ADDRESS;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailName = process.env.EMAIL_NAME;


const mail_response = (status, reservationTime) => {
    if (status === "confirmed") {
        return {
            subject: "Reservation Confirmed",
            html: `
            <h1>Your Reservation Has Been Confirmed!</h1>
            <p>Your reservation scheduled for ${reservationTime} has been successfully confirmed.</p>
            <p>We look forward to having you!</p>
            <h3>Have a blessed day.</p>`
        }
    } else if (status === "canceled") {
        return {
            subject: "Reservation Canceled",
            html: `
                <h1>Your Reservation Has Been Reservation</h1>
                <p>Your reservation schedule for ${reservationTime} has been canceled. This is because it wasn't confirmed within the allocated time window for confirmation and the table needs to be made available for others to book</p>
                <p>Please don't hesitate to reschedule.</p>
                <p>We look forward to having you here soon!</p>
                <h3>Have a blessed day.</p>`
        }
    } else if (status === "adjusted") {
        return {
            subject: "Reservation Adjusted",
            html: `
                <h1>Your Reservation Has Been Adjusted</h1>
                <p>Your reservation scheduled for ${reservationTime} has been adjusted to fit our schedule. Please visit the app to see this adjustment and confirm (or cancel) if you are okay with it.</p>
                <p>Please not that the reservation will be automatically canceled after 5 minutes of creation if not yet confirmed in order to give others the chance to also reserve the spot</p>
                <p>We look forward to having you!</p>
                <h3>Have a blessed day.</p>`
        }
    };
};


const mailer = async (to, status, reservationTime) => {
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: emailAddress,
            pass: emailPassword
        }
    });

    const mail_response_ = mail_response(status, reservationTime);

    const info = await transporter.sendMail({
        from: {
            name: emailName,
            address: emailAddress
        },
        to: to,
        subject: mail_response_.subject,
        html: mail_response_.html,
    });
    console.log("Email has been sent successfully");

    return { Message: info.messageId };
};

module.exports = { mailer };
