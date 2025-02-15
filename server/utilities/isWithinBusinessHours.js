const isWithinBusinessHours = (reservationTime, openingHours, reservationTimeRange) => {
    const [opening, closing] = openingHours.split(" - "); // Extract opening and closing times

    const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(" "); // "08:00 AM" -> ["08:00", "AM"]
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12; // Convert PM to 24-hour format
        if (modifier === "AM" && hours === 12) hours = 0; // Convert 12 AM to 00

        return { hours, minutes };
    };

    const { hours: openHours, minutes: openMinutes } = parseTime(opening);
    const { hours: closeHours, minutes: closeMinutes } = parseTime(closing);

    const openingTime = new Date(reservationTime);
    openingTime.setHours(openHours, openMinutes, 0, 0);

    const closingTime = new Date(reservationTime);
    closingTime.setHours(closeHours, closeMinutes, 0, 0);

    let result = false;
    let reservationStartTime = new Date(reservationTime);
    let reservationEndTime = new Date(reservationTime);
    reservationEndTime = reservationEndTime.setMinutes(reservationStartTime.getMinutes() + reservationTimeRange);
    reservationEndTime = new Date(reservationEndTime);
    if (reservationStartTime >= openingTime && reservationEndTime <= closingTime) {
        result = true;
    };

    return result;
};


module.exports = { isWithinBusinessHours };
