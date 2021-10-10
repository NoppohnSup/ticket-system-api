const {excuteQuery} = require('./connect')
const _ = require('lodash')

const login = async (req) => {
  let query = 'SELECT * FROM user WHERE username = ? AND password = ?'
  let data = await excuteQuery({
    query, values: [req.username, req.password]
  })

  let res = {
    user: data && data[0]
  }

  return res
}

module.exports = {
  login
}