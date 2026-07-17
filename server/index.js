const express = require('express')
const cloudbase = require('@cloudbase/node-sdk')

const app = express()
const port = process.env.PORT || 80
const tcb = cloudbase.init({
  env: process.env.TCB_ENV || 'prod-d8gy5es2o950fb769',
})
const db = tcb.database()

const collections = {
  templates: 'questionnaire_templates',
  records: 'questionnaire_records',
  counters: 'counters',
}

app.use(express.json())

const ok = (res, data) => {
  res.json({
    success: true,
    data,
  })
}

const fail = (res, error, status = 500) => {
  console.error(error)
  res.status(status).json({
    success: false,
    message: error.message || '服务器错误',
  })
}

app.get('/api/health', (req, res) => {
  ok(res, {
    service: 'collect-gong-server',
    env: process.env.TCB_ENV || 'prod-d8gy5es2o950fb769',
  })
})

app.post('/api/count', async (req, res) => {
  try {
    const action = req.body.action
    const counterId = 'default'
    const counterCollection = db.collection(collections.counters)
    const counter = await counterCollection.doc(counterId).get()
    const current = counter.data && counter.data[0] ? counter.data[0].count || 0 : 0
    const nextCount = action === 'inc' ? current + 1 : current

    if (counter.data && counter.data[0]) {
      await counterCollection.doc(counterId).update({
        count: nextCount,
        updatedAt: new Date(),
      })
    } else {
      await counterCollection.add({
        _id: counterId,
        count: nextCount,
        updatedAt: new Date(),
      })
    }

    ok(res, {
      count: nextCount,
    })
  } catch (error) {
    fail(res, error)
  }
})

app.get('/api/templates', async (req, res) => {
  try {
    const result = await db
      .collection(collections.templates)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const templates = (result.data || []).map((template) => ({
      id: template._id,
      ...template,
    }))

    ok(res, templates)
  } catch (error) {
    fail(res, error)
  }
})

app.post('/api/templates', async (req, res) => {
  try {
    const now = new Date()
    const body = req.body || {}
    const template = {
      name: body.name,
      fields: body.fields || [],
      count: body.count || 0,
      updatedAt: body.updatedAt,
      createdAt: now,
    }

    if (!template.name) {
      fail(res, new Error('模板名称不能为空'), 400)
      return
    }

    const result = await db.collection(collections.templates).add(template)
    ok(res, {
      id: result.id,
      ...template,
    })
  } catch (error) {
    fail(res, error)
  }
})

app.get('/api/records/groups', async (req, res) => {
  try {
    const templates = await db
      .collection(collections.templates)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const groups = (templates.data || []).map((template) => ({
      id: template._id,
      name: template.name,
      count: template.count || 0,
      latestAt: template.updatedAt || '',
    }))

    ok(res, groups)
  } catch (error) {
    fail(res, error)
  }
})

app.listen(port, () => {
  console.log(`Collect Gong server listening on ${port}`)
})
