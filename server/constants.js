const constants = Object.freeze({
    buffer: 20,
    pendingReservationGrace: 10
});

const STAFF_ROLES = Object.freeze({
    STAFF: "staff",
    ADMIN: "admin"
});

module.exports = { constants, STAFF_ROLES };
