const request2 = require('request');

import Knex from './knex';

export function sms(to, message) {
  //   logger.info(`sms: ${to}, ${message}`);
  return new Promise(async resolve => {
    if (to && message) {
      const url = 'http://login.smsmoon.com/API/sms.php';
      const body = {
        username: 'raghugroup',
        password: 'abcd.1234',
        from: 'AKSOFT',
        to,
        msg: message,
        type: '1',
        dnd_check: '0'
      };
      await request2.post(
        url,
        {
          form: body
        },
        (error, response) => {
          if (!error && parseInt(response.statusCode, 10) === 200) {
            // console.log(body) // Print the google web page.
            resolve({
              success: true,
              data: 'SMS sent successfully'
            });
          } else {
            resolve({
              success: false,
              message: 'SMS failed'
            });
          }
        }
      );
    } else {
      return {
        success: false,
        message: 'To or Message missing'
      };
    }
  });
}
