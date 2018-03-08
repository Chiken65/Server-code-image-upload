import jwt from 'jsonwebtoken';
import Knex from './knex';
import {
  sms
} from './helper';
import {
  log
} from './log';
import config from './config';

const bcrypt = require('bcrypt');
const Bcrypt = require('bcrypt');
const fs = require('fs');

const routes = [
  /* Authentication */
  /* USERS */
  // authentication
  {
    path: '/auth',
    method: 'POST',
    options: {
      cors: true
    },
    handler: async request => {
      log.logApi(request);
      if (!request.payload || !request.payload.username || !request.payload.password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }
      const {
        username,
        password
      } = request.payload;
      let res = null;

      const query = `select u.id, u.username, u.password, u.name, u.email, u.mobile, u.role from users u where u.username = '${username}' limit 1`;
      log.info(request, `query:`, query);

      await Knex.raw(query)
        .then(async ([user]) => {
          log.info(request, `query result:`, user);

          if (!user.length) {
            res = {
              success: false,
              error: 'The specified user was not found'
            };
            log.error(request, 'User not found', user);
          } else {
            const userFound = user[0] && bcrypt.compareSync(password, user[0].password);
            if (userFound) {
              const token = jwt.sign({
                  id: user[0].id,
                  username: user[0].username,
                  name: user[0].name,
                  email: user[0].email,
                  mobile: user[0].mobile,
                  role: user[0].role
                },
                'vZiYpmTzqXMp8PpYXKwqc9ShQ1UhyAfy', {
                  algorithm: 'HS256'
                  // expiresIn: '24h'
                }
              );

              res = {
                success: 'true',
                token
              };

              log.info(request, 'token generated', token);
            } else {
              res = {
                success: false,
                error: 'Incorrect Password'
              };
              log.error(request, 'Incorrect Password');
            }
          }
        })
        .catch(err => {
          const error = `server error: ${err}`;
          res = {
            success: false,
            error
          };
          log.error(request, 'Server error', err);
        });
      log.info(request, 'response', res);
      return res;
    }
  },

  // add & edit user
  {
    method: 'POST',
    path: '/users',
    options: {
      cors: true
    },
    async handler(request) {
      log.logApi(request);

      let res;
      let hash;

      const {
        username,
        password,
        name,
        email,
        mobile,
        role
      } = request.payload;

      const letter = password.charAt(0);
      if (letter === '$') {
        hash = password;
      } else {
        hash = Bcrypt.hashSync(password, 10);
      }

      const q = Knex.raw(
        `insert into users (username, password, name, email, mobile, role) values(?,?,?,?,?,?) on duplicate key update  name = ?, email = ?, mobile = ? , role = ? , password = ? `, [username, hash, name, email, mobile, role, name, email, mobile, role, hash]
      );
      log.info(request, `query:`, q.toString());
      await q
        .then(([data]) => {
          log.info(request, `query result:`, data);

          // console.log(data)
          if (!data.affectedRows) {
            res = {
              success: false,
              error: 'No data updated or inserted'
            };
          } else {
            res = {
              success: true
            };
          }
        })
        .catch(err => {
          log.error(request, 'Server error', err);
        });
      log.info(request, 'response', res);

      return res;
    }
  },
  // list all parts registered in the system
  {
    method: 'GET',
    path: '/list_parts',
    options: {
      cors: true
    },
    async handler(request) {
      log.logApi(request);
      let res;
      const q = `select code, name, is_parent, image, created_at from codes order by created_at desc`;
      log.info(request, `query:`, q);

      log.info(q);
      await Knex.raw(q)
        .then(([data]) => {
          log.info(request, `query result:`, data);
          res = data;
        })
        .catch(err => {
          log.error(request, 'Server error', err);
        });
      log.info(request, 'response', res);

      return res;
    }
  },

  //Rohith
  //Copy image to folder and add to database
  {
    method: 'POST',
    path: '/codes',
    options: {
      cors: true,
      payload: {
        output: 'stream',
        maxBytes: 10048576,
        parse: true,
        allow: 'multipart/form-data',
        timeout: 110000
      }
    },

    async handler(request) {
      let res = null;
      const data = request.payload;
      const {
        image
      } = request.payload;
      // console.log('image', image, filename);

      const input = {
        image
      };
      // if file is present
      if (request.payload.file.hapi.filename) {
        const fileName = image;
        const extension = fileName.match(/\.(jpg|jpeg|png|gif)$/);

        if (!extension) {
          res = {
            success: false,
            error: 'Image'
          };
        }
        input.image = fileName;

        const path = config.upload_folder + fileName;
        const name = fileName;
        // console.log(path);

        const file = fs.createWriteStream(path);

        file.on('error', err => {
          log.error(err);
        });

        data.file.pipe(file);

        data.file.on('end', err => {
          if (err) {
            res = {
              success: false,
              message: 'File upload failed, please try again'
            };
          } else {
            const q = Knex.raw(
              `INSERT INTO images_list(img_name) VALUES (?)`, [fileName]
            );
            q.then(([data]) => {
                log.info(request, `query result:`, data);
                res = {
                  success: false,
                  message: 'File upload successfully..!'
                };
              })
              .catch(err => {
                log.error(request, 'Server error', err);
              });
            log.info(request, 'response', res);

            return res;
          }

        });
      }

      return res;
    }
  },

  // getlist of images(names) from database 
  {
    method: 'GET',
    path: '/img_list',
    options: {
      cors: true
    },
    async handler(request) {
      log.logApi(request);
      let res;
      const q = `SELECT * FROM images_list il ORDER BY il.created_at DESC`;
      log.info(request, `query:`, q.toString());
      log.info(q);
      await Knex.raw(q)
        .then(([data]) => {
          log.info(request, `query result:`, data);
          res = data;
        })
        .catch(err => {
          log.error(request, 'Server error', err);
        });
      log.info(request, 'response', res);

      return res;
    }
  },

  // sms
  {
    method: 'POST',
    path: '/get_sms',
    options: {
      cors: true
    },
    async handler(request) {
      log.logApi(request);
      const {
        username,
        masertPart
      } = request.payload;
      let res;
      let to;
      let message;

      const q = Knex.raw(`SELECT mobile,email FROM users where role='predispatch' limit 1`);
      log.info(request, `query:`, q.toString());
      await q
        .then(([data]) => {
          log.info(request, `query result:`, data);
          to = data[0].mobile;
          message = `CPMS Alert: ${username.toUpperCase()} has scanned a wrong child for master ${masertPart}`;
          res = sms(to, message);
        })
        .catch(err => {
          log.error(request, 'Server error', err);
        });
      log.info(request, 'response', res);

      return res;
    }
  },

  {
    path: '/image/{image}',
    method: 'GET',
    options: {
      cors: true
    },
    handler: async (request, h) => h.file(config.upload_folder + request.params.image)
    // handler: async (request, reply) => {
    //   const { image } = request.params;
    //   // console.log('image_path', config.upload_folder + image);
    //   // return reply.file(config.upload_folder + image);
    // }
  }
];

async function deleteParts(code, barcode) {
  log.info('In deleteParts function', code, barcode);
  let res;
  const q = Knex.raw(`DELETE FROM master_parts WHERE code=? and barcode=?`, [code, barcode]);
  log.info(`deleteParts`, `query:`, q.toString());

  await q
    .then(([data]) => {
      log.info(`deleteParts`, `query result:`, data);
      res = {
        success: true,
        data
      };
    })
    .catch(err => {
      log.error(`deleteParts`, 'Server error', err);
    });
  log.info(`deleteParts`, 'response', res);

  return res;
}

async function getChildParts(barcode, stage) {
  log.info('In getChildParts function', barcode, stage);
  let res;
  let insertId;

  const q = Knex.raw(
    `select mastertable.name as master, c.code, c.name, c.image from 
          codes c 
          inner join master_child mc on mc.child_code = c.code 
          inner join master_parts m on m.code = mc.master_code 
          inner join codes mastertable on mastertable.code = mc.master_code and mastertable.is_parent = 1
           where m.barcode = ?`, [barcode]
  );
  log.info(`getChildParts`, `query:`, q.toString());

  await q
    .then(([data]) => {
      log.info(`getChildParts`, `query result:`, data);

      if (!data.length) {
        res = {
          success: false,
          error: 'No child parts found for that barcode'
        };
      } else {
        insertId = data.insertId;
        res = {
          success: true,
          data
        };
        const k = Knex.raw(`replace into master_scans (barcode,stage) values(?,?)`, [
          barcode,
          stage
        ]);
        log.info(`getChildParts`, `query:`, k.toString());

        k
          .then(async ([data1]) => {
            log.info(`getChildParts`, `query result:`, data1);

            if (!data1.affectedRows) {
              res = {
                success: false,
                error: 'No data inserted'
              };
            } else {
              res = {
                success: true,
                data1,
                id: insertId
              };
            }
          })
          .catch(err => {
            log.error(`getChildParts`, 'Server error', err);
          });
      }
    })
    .catch(err => {
      log.error(`getChildParts`, 'Server error', err);
    });
  log.info(`getChildParts`, 'response', res);
  return res;
}

function insertOrUpdate(knex, tableName, data) {
  const firstData = data[0] ? data[0] : data;
  return knex.raw(
    `${knex(tableName)
      .insert(data)
      .toQuery()} ON DUPLICATE KEY UPDATE ${Object.getOwnPropertyNames(firstData)
      .map(field => `${field}=VALUES(${field})`)
      .join(',  ')}`
  );
}

export default routes;