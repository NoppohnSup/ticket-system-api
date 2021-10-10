const {excuteQuery} = require('./connect')
const _ = require('lodash')

const listTicketOrder = async (req) => {
  const params = req.query
  const limit = params.limit
  const offset = params.offset
  const startDate = params.startDate
  const endDate = params.endDate
  const ticketTypes = params.ticketTypes || []

  let values = []
  let where = ''

  if (ticketTypes.length > 0) {
    // const ticketIn = _.join(ticketTypes, ',')

    where += 'AND ol.id_ticket_type IN (?) '
    values = [...values, ticketTypes]
  }

  if (!_.isEmpty(startDate) && !_.isEmpty(endDate)) {
    where += 'AND ot.payment_date BETWEEN ? AND ? '
    values = [...values, startDate, endDate]
  }

  let query = `SELECT * FROM order_line_item ol
    INNER JOIN order_ticket ot ON ot.id = ol.id_order
    INNER JOIN ticket_type tt ON tt.id = ol.id_ticket_type
    WHERE 1 = 1 ${where} LIMIT ? OFFSET ?`

  console.log('query===>', query)
  console.log('values1===>', values)

  let data = await excuteQuery({
    query, values: [...values, limit, offset]
  })

  console.log('values2===>', values)
  let countQuery = `SELECT COUNT(*) as total FROM order_line_item ol
    INNER JOIN order_ticket ot ON ot.id = ol.id_order
    INNER JOIN ticket_type tt ON tt.id = ol.id_ticket_type
    WHERE 1 = 1 ${where}`
  console.log('countQuery===>', countQuery)

  let count = await excuteQuery({
    query: countQuery, values
  })

  return {
    ticketOrderData: data,
    count
  }
}

const insertTicketOrder = async (request, callBack) => {
  const validate = new Promise((resolve, reject) => {
    request.order_line.every(async (v, index) => {
      let queryTicketType = `SELECT * FROM ticket_type WHERE id = ?`
      let ticketType = await excuteQuery({
        query: queryTicketType, values: [v.id]
      })

      let limitPerDay = ticketType[0].limit_per_day

      let queryOrderToday = `SELECT SUM(ol.qty) as total_qty, ol.id_ticket_type FROM order_line_item ol ` +
        `INNER JOIN order_ticket ot ON ot.id = ol.id_order ` +
        `WHERE ol.id_ticket_type = ? AND DATE(ot.payment_date) = CURDATE() ` +
        `GROUP BY ol.id_ticket_type`
      let orderToday = await excuteQuery({
        query: queryOrderToday, values: [v.id]
      })

      if (orderToday.length > 0) {
        let ticketData = _.find(orderToday, {'id_ticket_type': v.id})
        let total = parseInt(ticketData.total_qty) + parseInt(v.qty)
        if (total > limitPerDay) {
          let ticketInstock = parseInt(limitPerDay) - parseInt(ticketData.total_qty);
          reject(`ticket type ${ticketType[0].ticket_type} have ${ticketInstock} ticket in stock.`)
          return false
        }

        if (index === (request.order_line.length - 1)) resolve('success')
      } else {
        resolve('success')
        return false
      }


      return true
    })
  })

  const checkIfItsDone = () => {
    return validate.then(async ok => {
        let totalPrice = request.order_line.map(item => item.totalPrice).reduce((prev, curr) => prev + curr, 0)
        let queryInsert = `INSERT INTO order_ticket(id_user, total_price, status, created_at, updated_at, payment_date)` +
          `VALUES (?, ?, 1, now(), now(), now())`
        let insertOrder = await excuteQuery({
          query: queryInsert, values: [request.id_user, totalPrice]
        })

        request.order_line.forEach(async v => {
          let queryLineInsert = `INSERT INTO order_line_item( id_order, id_ticket_type, qty, total_price)` +
            `VALUES (?, ?, ?, ?)`

          await excuteQuery({
            query: queryLineInsert, values: [insertOrder.insertId, v.id, v.qty, v.totalPrice]
          })
        })

        callBack({'message': 'success'})
      })
      .catch(err => {
        console.log('err==>', err)
        callBack({'message': err})
      })
  }

  checkIfItsDone()
}

module.exports = {
  listTicketOrder,
  insertTicketOrder
}