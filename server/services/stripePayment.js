const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const { Reservation } = require("../models");


const stripePayment = async (userId, reservationId) => {
    try {
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }
        });

        if (!reservation) {
            return { message: "Reservation not found" };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'ngn',
                        product_data: {
                            name: `Table ${reservation.dataValues.tableId}`
                        },
                        unit_amount: 5000000
                    },
                    quantity: 1
                }
            ],
            metadata: { userId, reservationId },
            success_url: "http://www.mydomain.com/reservation/payment/success",
            cancel_url: "http://www.mydomain.com/reservation/payment/failed",
            // expires_at: Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
        });

        return { url: session.url };
    } catch (error) {
        console.log(error);
        return { message: " failed to make payment" };
    };
};

module.exports = { stripePayment };
