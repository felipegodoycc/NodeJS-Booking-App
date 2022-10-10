const fs = require('fs');
const {google} = require('googleapis');
const reqValidator = require('../../Utility/requirement-validator.js');
const appUtil = require('../../Utility/appUtil.js');
const { initLogger } = require('../../Utility/logger.js');

const TIMESLOTS_PATH = './Utility/timeslots.json';
const logger = initLogger('POST - Book')
/**
 * Searches using the provided date for a timeslot matching the hour and minute specified.
 * @param {object} timeslots  Object containing info on each timeslot for the day.
 * @param {number} year  Year of the timeslot to search for.
 * @param {number} month  Month of the timeslot to search for.
 * @param {number} day  Day of the timeslot to search for.
 * @param {number} hour  Hour of the timeslot to search for.
 * @param {number} minute  Minute of the timeslot to search for.
 * @returns {object}  The timeslot object that was found. If nothing was found, returns undefined.
 */
function findMatchingTimeslot(timeslots, { year, month, day, hour, minute }) {
    logger.debug("[findMatchingTimeslot] Datos: ", year, month, day, hour, minute);
    const timeslotDate = new Date(Date.UTC(year, month-1, day, hour, minute)).toISOString();
    logger.debug("[findMatchingTimeslot] Timeslot a reservar: ", timeslotDate)
    const foundTimeslot = timeslots.find(function (element) {
        //const elementDate = new Date(element.startTime).toISOString(); // Ensure matching ISO format.
        return element.startTime.includes(hour + ':' + minute  + ':00');
    });
    if (!foundTimeslot) return false;
    return {time: foundTimeslot, date: timeslotDate};
}

/**
 * Books an appointment using the given date and time information.
 * @param {object} auth  The oAuth2Client used for authentication for the Google Calendar API.
 * @param {object} eventData
 * @param {object} personalData
 * @returns {promise}  A promise representing the eventual completion of the bookAppointment() function.
 */
function bookAppointment(auth, eventData, personalData) {
    // TO DO: Validar si el slot esta disponible
    return new Promise(function(resolve, reject) {
        logger.debug("[bookAppointment] Event data: ", eventData);
        logger.debug("[bookAppointment] User data: ", personalData);
        const parsedEventData = appUtil.parseBookingData(eventData);
        const isInvalid = reqValidator.validateBooking(parsedEventData);
        if (isInvalid) return reject(isInvalid);

        const timeslots = (JSON.parse(fs.readFileSync(TIMESLOTS_PATH))).timeslots;
        const timeslot = findMatchingTimeslot(timeslots, parsedEventData);
        if (!timeslot) return resolve({success: false, message: 'Invalid time slot'});
        const date = eventData.date;
        const event = appUtil.makeEventResource(date, timeslot.time.startTime, timeslot.time.endTime, personalData);
        logger.debug("[bookAppointment] Evento: ", event)
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            sendUpdates: 'all',
            resource: event
        }, function (err, res) {
            if (err){
                logger.error('[bookAppointment] Error contacting the Calendar service: ' + JSON.stringify(err))
                return resolve({ success: false, message: 'Error GCalendar API'})
            };
            const event = res.data;
            logger.debug('Appointment created: ', event.id);
            const result = {startTime: event.start.dateTime, endTime: event.end.dateTime};
            const response = Object.assign({success: true}, result);
            return resolve(response);
        });
    });
}

module.exports = {
    bookAppointment
};