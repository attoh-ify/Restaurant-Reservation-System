const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const { setStatus } = require("../utilities/setStatus");


const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];  // Extract signature: When Stripe sends a webhook event to your endpoint, it includes a header called Stripe-Signature. This header contains a cryptographic signature (sig) that allows you to verify that the request actually came from Stripe and was not tampered with.

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);  // In Stripe webhooks, event refers to the object that Stripe sends to your webhook endpoint when a specific event occurs (e.g., successful payment, refund, etc.).

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            const userId = session.metadata.userId;
            const reservationId = session.metadata.reservationId;

            console.log(`Payment successful for User: ${userId}, Reservation: ${reservationId}`);

            // ✅ Update reservation status in the database
            console.log("Updating status")
            setStatus("confirmed", reservationId);

            console.log("Reservation updated successfully.");
        } else if (event.type === "payment_intent.payment_failed" || event.type === "checkout.session.expired" ) {
            const paymentIntent  = event.data.object;

            const userId = paymentIntent .metadata.userId;
            const reservationId = paymentIntent .metadata.reservationId;

            console.log(`Payment failed for User: ${userId}, Reservation: ${reservationId}`);

            // ✅ Update reservation status in the database
            setStatus("canceled", reservationId);

            console.log("Reservation updated successfully.");
        };
        return res.status(200).send();
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

module.exports = { stripeWebhook };
