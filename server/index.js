const path = require('path')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { init: initDB, Template, Record } = require('./db')

const app = express()
const logger = morgan('tiny')
const port = process.env.PORT || 80

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())
app.use(logger)

const sendOk = (res, data) => {
  res.send({
    code: 0,
    data,
  })
}

const sendFail = (res, error, status = 500) => {
  console.error(error)
  res.status(status).send({
    code: -1,
    message: error.message || '服务器错误',
  })
}

const formatTime = (date) => {
  if (!date) {
    return ''
  }

  const value = new Date(date)
  const pad = (number) => number.toString().padStart(2, '0')
  const year = value.getFullYear()
  const month = pad(value.getMonth() + 1)
  const day = pad(value.getDate())
  const hour = pad(value.getHours())
  const minute = pad(value.getMinutes())

  return `${year}/${month}/${day} ${hour}:${minute}`
}

const serializeTemplate = (template) => ({
  id: template.id,
  name: template.name,
  fields: template.fields || [],
  count: template.count || 0,
  updatedAt: template.displayUpdatedAt || formatTime(template.updatedAt),
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/api/health', (req, res) => {
  sendOk(res, {
    service: 'collect-gong-server',
    database: 'collect_gong',
  })
})

app.get('/api/wx_openid', (req, res) => {
  if (req.headers['x-wx-source']) {
    res.send(req.headers['x-wx-openid'])
    return
  }

  res.send('')
})

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100,
    })

    sendOk(res, templates.map(serializeTemplate))
  } catch (error) {
    sendFail(res, error)
  }
})

app.post('/api/templates', async (req, res) => {
  try {
    const body = req.body || {}
    const name = body.name && body.name.trim()

    if (!name) {
      sendFail(res, new Error('模板名称不能为空'), 400)
      return
    }

    const template = await Template.create({
      name,
      fields: body.fields || [],
      count: 0,
      displayUpdatedAt: body.updatedAt || formatTime(new Date()),
    })

    sendOk(res, serializeTemplate(template))
  } catch (error) {
    sendFail(res, error)
  }
})

app.get('/api/records/groups', async (req, res) => {
  try {
    const templates = await Template.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100,
    })

    const groups = await Promise.all(templates.map(async (template) => {
      const count = await Record.count({
        where: {
          templateId: template.id,
        },
      })
      const latestRecord = await Record.findOne({
        where: {
          templateId: template.id,
        },
        order: [['createdAt', 'DESC']],
      })

      return {
        id: template.id,
        name: template.name,
        count,
        latestAt: latestRecord ? formatTime(latestRecord.createdAt) : serializeTemplate(template).updatedAt,
      }
    }))

    sendOk(res, groups)
  } catch (error) {
    sendFail(res, error)
  }
})

app.post('/api/records', async (req, res) => {
  try {
    const body = req.body || {}

    if (!body.templateId) {
      sendFail(res, new Error('模板 ID 不能为空'), 400)
      return
    }

    const template = await Template.findByPk(body.templateId)
    if (!template) {
      sendFail(res, new Error('模板不存在'), 404)
      return
    }

    const record = await Record.create({
      templateId: template.id,
      templateName: template.name,
      submitterName: body.submitterName || '',
      submitterOpenid: req.headers['x-wx-openid'] || '',
      data: body.data || {},
    })

    await template.increment('count')
    await template.update({
      displayUpdatedAt: formatTime(new Date()),
    })

    sendOk(res, {
      id: record.id,
      templateId: record.templateId,
      templateName: record.templateName,
      submitterName: record.submitterName,
      data: record.data,
      createdAt: formatTime(record.createdAt),
    })
  } catch (error) {
    sendFail(res, error)
  }
})

async function bootstrap() {
  await initDB()
  app.listen(port, () => {
    console.log('启动成功', port)
  })
}

bootstrap()
