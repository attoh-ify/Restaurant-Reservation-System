const sortSchedule = (schedule, newSchedule) => {
    try {
        let _schedule = [...schedule];  // shallow copy
        let low = 0;
        let high = _schedule.length;

        // Binary search to find the correct insertion index
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (new Date(_schedule[mid].startTime) < newSchedule.startTime) {
                low = mid + 1;
            } else {
                high = mid;
            };
        };

        // Insert the new reservation at the correct position
        _schedule.splice(low, 0, newSchedule);
        return _schedule;
    } catch (error) {
        console.log(error);
        return { message: error.message };
    };
};


module.exports = { sortSchedule };
