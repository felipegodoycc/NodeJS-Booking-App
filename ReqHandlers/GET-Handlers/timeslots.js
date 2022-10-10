const fs = require('fs');
const {google} = require('googleapis');
const reqValidator = require('../../Utility/requirement-validator.js');
const appUtil = require('../../Utility/appUtil.js');
const { initLogger } = require('../../Utility/logger.js');

const TIMESLOTS_PATH = './Utility/timeslots.json';
const logger = initLogger('GET - Timeslots')
/**
 * Returns an array with timeslots; excluding the timeslots that are booked (appointments).
 * @param {object} appointments  An Object containing info on the appointments booked in the day.
 * @returns {object[]} resultsArr  An array containing all the available timeslots in the day.
 */
function getResult(appointments) {
    logger.debug("[getResult] Reservas: ", appointments)
    const timeslots = (JSON.parse(fs.readFileSync(TIMESLOTS_PATH))).timeslots;
    let resultsArr = [];
    for (let i = 0; i < timeslots.length; i++) {
        const found = appointments.find(function (element) {
            const startTime = element.startTime;
            const finalStartTime = startTime.substring(startTime.indexOf("T"), startTime.length - 6 );
            return timeslots[i].startTime.includes(finalStartTime);
        });
        if (found) {
            resultsArr.push({ ...timeslots[i], available: false});
        } else {
            resultsArr.push({ ...timeslots[i], available: true });
        }
    }
    return resultsArr;
}

/**
 * Returns a promise with data containing objects with information of the timeslots in the given day.
 * Each object contains the startTime and endTime of the timeslot.
 * @param {object} auth  The oAuth2Client used for authentication for the Google Calendar API.
 * @param {number} year  Year to search for.
 * @param {number} month  Month to search for.
 * @param {number} day  Day to search for.
 * @returns {promise}  A promise representing the eventual completion of the getAvailTimeslots() function.
 */
function getAvailTimeslots(auth, year, month, day) {
    return new Promise(function(resolve, reject) {
        logger.debug("[getAvailTimeslots] Input data: ", {year, month, day})
        const isInvalid = reqValidator.validateGetTimeslots(year, month, day);
        if (isInvalid) return reject(isInvalid);

        const startDate = new Date(Date.UTC(year, month-1, day));
        const endDate = appUtil.getNextDay(startDate);
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.list({
            calendarId: 'primary',
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            maxResults: 11,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, res) => {
            if (err) return reject({response: 'The API returned an error: ' + err});
            let appointments = res.data.items.map((event, i) => {
                return {startTime: event.start.dateTime, endTime: event.end.dateTime};
            });
            const result = {};
            result.timeslots = getResult(appointments);
            if (result.timeslots[0]) {
                const response = Object.assign({success: true}, result);
                return resolve(response);
            } else {
                const response = Object.assign({success: false}, result);
                return reject(response);
            }
        });
    });
}

module.exports = {
    getAvailTimeslots
};