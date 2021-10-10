const mysql = require('mysql2/promise')

const excuteQuery = async ({query, values}) => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'ticket_management_system',
    port: '3306'
  })

  console.log('values query =====>', values)
  try {
    const [rows] = await connection.execute(query, values);
    await connection.end();

    return rows
  } catch (error) {
    return {error}
  }
}

module.exports = {
  excuteQuery
}