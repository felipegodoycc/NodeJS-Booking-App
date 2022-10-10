const { initLogger } = require("./logger");

const logger = initLogger('AppUtils')
/**
 * Returns the last day of the month.
 * @param {number} year  The year.
 * @param {number} month  The month.
 * @returns {number}  The last day of the month.
 */
function getLastDayOfMonth(year, month) {
    const lastDay = (new Date(Date.UTC(year, month, 0))).getUTCDate()
    logger.debug("[getLastDayOfMonth] Last day: ", lastDay)
    return lastDay;
}

/**
 * Returns the current date in the UTC timezone.
 * @returns {number}
 */
function getCurrDateUTC() {
    const currDate = new Date();
    logger.debug("[getCurrDateUTC] currentDateUTC: ", currDate.getUTCDate())
    return currDate.getUTCDate();
}

/**
 * Returns the date from a given ISOString.
 * @param {string} dateISOString  The callback for the authorized client.
 * @returns {number}
 */
function getDateFromISO(dateISOString) {
    const date = new Date(dateISOString);
    return date.getUTCDate();
}

/**
 * Returns the next date (i.e the day after).
 * @param {Date} date  The date to get the next day of.
 * @returns {Date}
 */
function getNextDay(date) {
    let tomorrow = new Date(date);
    tomorrow.setDate(date.getUTCDate() + 1); // Returns epoch value.
    return new Date(tomorrow); // Convert from epoch to Date.
}

/**
 * Creates and returns a Google Calendars 'events resource'.
 * @param {string} date  A string in the following format: 'Year-month-day'.
 * @param {string} startTime  The start time to associate with the 'start dateTime'.
 * @param {string} endTime  The end time to associate with the 'end dateTime'.
 * @returns {object}  A Google Calendars 'events resource'.
 */
function makeEventResource(date, startTime, endTime, eventData) {
    logger.debug("[makeEventResource] Creando evento", date, startTime, endTime, eventData)
    try {
        return {
            'summary': `Reserva BossWash Santiago`, // Nombre del evento,
            'location': 'San Pablo 2124, Santiago, 8340242, Región Metropolitana', 
            'description': `Nombre: ${ eventData.name } ${ eventData.lastName} - Contacto: ${ eventData.phone }`, // Descripcion del evento
            'attendees': [ // Invitados Ej: {'email': 'lpage@example.com'}
                {
                    'email': eventData.email
                }
            ],
            'start': { // Inicio evento
                'dateTime': date + startTime ,
                'timeZone': 'America/Santiago',
            },
            'end': { // Fin evento
                'dateTime': date + endTime ,
                'timeZone': 'America/Santiago',
            }
        };
    } catch (error) {
        logger.error("[makeEventResource] Error creando evento", error)
    }
}

function parseBookingData({ date, time }) {
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.substring(1, time.length - 6).split(':');
    return {
        year,
        month,
        day,
        hour,
        minute
    }
}

module.exports = {
    getLastDayOfMonth,
    getCurrDateUTC,
    getDateFromISO,
    getNextDay,
    makeEventResource,
    parseBookingData
};