const log4js = require('log4js');

function initLogger(name){
    const LOGGER_LEVEL = process.env.LOGGER_LEVEL;
    const logger = log4js.getLogger(name);
    logger.level = LOGGER_LEVEL;
    return logger
}

module.exports = {
    initLogger
}