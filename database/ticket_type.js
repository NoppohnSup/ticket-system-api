const {excuteQuery} = require('./connect')
const _ = require('lodash')

const listTicketType = async () => {
  let query = 'SELECT * FROM ticket_type'

  return await excuteQuery({
    query, values: []
  })
}

const listTicketTypeStock = async (req) => {
  const params = req.query
  const startDate = params.startDate
  const endDate = params.endDate
  const limit = params.limit
  const offset = params.offset
  const ticketType = params.ticketType

  let values = []
  let where = ''

  if (!_.isEmpty(ticketType)) {
    where += 'AND ol.id_ticket_type = ? '
    values = [...values, ticketType]
  }

  if (!_.isEmpty(startDate) && !_.isEmpty(endDate)) {
    where += 'AND DATE(ot.payment_date) BETWEEN ? AND ? '
    values = [...values, startDate,  endDate]
  }

  let queryOrderToday = `SELECT SUM(ol.qty) as total_qty, tt.ticket_type, tt.limit_per_day, ot.payment_date  FROM order_line_item ol ` +
    `INNER JOIN order_ticket ot ON ot.id = ol.id_order ` +
    `INNER JOIN ticket_type tt ON tt.id = ol.id_ticket_type ` +
    `WHERE 1=1 ${where} ` +
    `GROUP BY ol.id_ticket_type, ot.payment_date LIMIT ? OFFSET ? `
  let orderToday = await excuteQuery({
    query: queryOrderToday, values: [...values, limit, offset]
  })

  let countQuery = `SELECT COUNT(*) as total FROM order_line_item ol ` +
    `INNER JOIN order_ticket ot ON ot.id = ol.id_order ` +
    `INNER JOIN ticket_type tt ON tt.id = ol.id_ticket_type ` +
    `WHERE 1=1 ${where} ` +
    `GROUP BY ol.id_ticket_type, ot.payment_date `

  let count = await excuteQuery({
    query: countQuery, values
  })

  return {
    ticketTypeStock: orderToday,
    count
  }
}

module.exports = {
  listTicketType,
  listTicketTypeStock
}