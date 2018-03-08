export default require('knex')({
  client: 'mysql',
  connection: {
    host: 'localhost',

    user: 'root',
    password: '',

    database: 'erp_webdata_rohith',
    charset: 'utf8'
  }
});
