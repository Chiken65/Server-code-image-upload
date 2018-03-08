import config from './config';

const moment = require('moment');
const winston = require('winston');
require('winston-daily-rotate-file');

// const { createLogger, format, transports } = require('winston');

// const myFormat = format.printf(
//   info => `${moment().format('YYYY-MM-DD HH:mm:ss')} ${info.level}: ${info.message}`
// );

// const tsFormat = () => new Date().toLocaleTimeString();
const tsFormat = () => moment().format('YYYY-MM-DD HH:mm:ss');

// const LOG_TRANSPORTS = {
//   console: new winston.transports.Console({
//     level: 'info'
//     // format: format.combine(
//     //   format.colorize(),
//     //   info => `${moment().format('YYYY-MM-DD HH:mm:ss')} ${info.level}: ${info.message}`
//     // )
//   }),
//   // errorFile: new winston.transports.File({
//   //   filename: './logs/error.log',
//   //   level: 'error',
//   //   timestamp: tsFormat
//   // }),
//   infoFile: new winston.transports.File({
//     filename: 'c:/mysqlbackups/logs/info.log',
//     level: 'info',
//     timestamp: tsFormat
//   })
//   // noticeFile: new winston.transports.File({
//   //   filename: './logs/notice.log',
//   //   level: 'notice',
//   //   timestamp: tsFormat
//   // })
// };

const logger = new winston.Logger({
  // label({ label: 'upload-server' }),
  // levels: {
  //   emerg: 0,
  //   alert: 1,
  //   crit: 2,
  //   error: 3,
  //   warning: 4,
  //   notice: 5,
  //   info: 6,
  //   debug: 7
  // },
  // format: myFormat,
  // transports: [
  //   LOG_TRANSPORTS.console,
  //   // LOG_TRANSPORTS.errorFile,
  //   LOG_TRANSPORTS.infoFile
  //   // LOG_TRANSPORTS.noticeFile
  // ]
  transports: [
    // colorize the output to the console
    new winston.transports.DailyRotateFile({
      filename: `${config.log_folder}cpms-server-info.log`,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      level: 'info',
      timestamp: tsFormat
    })
  ]
});

export const log = {
  logApi: request => {
    const message = [];
    console.log(request);
    if (request && request.url && request.url.path) {
      message.push(`${JSON.stringify(request.url.path)}`);
    }
    // if (request && request.auth && request.auth.credentials) {
    //   message.push(`auth: ${JSON.stringify(request.auth.credentials)}`);
    // }
    if (request && request.params && Object.keys(request.params).length) {
      message.push(`params: ${JSON.stringify(request.params)}`);
    }
    if (request && request.payload && Object.keys(request.payload).length) {
      message.push(`payload: ${JSON.stringify(request.payload)}`);
    }

    if (message.length) {
      logger.info(message.join(', '));
    }
  },

  info: (request, msg, ...others) => {
    logMessage('info', request, msg, others);
  },

  notice: (request, msg, ...others) => {
    logMessage('notice', request, msg, others);
  },

  error: (request, msg, ...others) => {
    logMessage('error', request, msg, others);
  }
};

function logMessage(type, request, msg, others) {
  const message = [];
  if (request && request.url && request.url.path) {
    message.push(`${JSON.stringify(request.url.path)}`);
  }
  message.push(msg);

  others.forEach(item => {
    if (item) {
      message.push(JSON.stringify(item));
    }
  });

  // retrieve other objects that are sent
  if (message.length) {
    switch (type) {
      // case 'error':
      //   logger.error(message.join(', '));
      //   break;
      default:
        logger.info(message.join(', '));
        break;
    }
  }
}

export default logger;
