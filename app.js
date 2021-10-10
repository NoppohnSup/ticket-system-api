const express = require('express')
const cors = require('cors')
const app = express()
const port = 8082
const {listTicketOrder, insertTicketOrder} = require('./database/ticket_order')
const {listTicketType, listTicketTypeStock} = require('./database/ticket_type')
const {login} = require('./database/user')
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.json())

app.get('/ticket_order/list', async (req, res) => {
  const data = await listTicketOrder(req);
  res.send(data)
})

app.get('/ticket_type/list', async (req, res) => {
  const data = await listTicketType();
  res.send(data)
})

app.get('/ticket_type/stock/list', async (req, res) => {
  const data = await listTicketTypeStock(req);
  res.send(data)
})

app.post('/ticket_type/create', async (req, res) => {
  await insertTicketOrder(req.body, (data) => res.send(data))
})

app.post('/login', async (req, res) => {
  const data = await login(req.body)
  res.send(data)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})