const cloudEnv = 'prod-d8gy5es2o950fb769'
const cloudService = 'express-8m4q'

const callContainer = ({ path, method = 'GET', data = {} }) => {
  return new Promise((resolve, reject) => {
    if (!wx.cloud || !wx.cloud.callContainer) {
      reject(new Error('当前基础库不支持 wx.cloud.callContainer'))
      return
    }

    wx.cloud.callContainer({
      config: {
        env: cloudEnv,
      },
      path,
      header: {
        'X-WX-SERVICE': cloudService,
      },
      method,
      data,
      success: (res) => {
        const body = res.data || {}
        if (body.success === false) {
          reject(new Error(body.message || '服务器请求失败'))
          return
        }

        resolve(body.data === undefined ? body : body.data)
      },
      fail: reject,
    })
  })
}

const createTemplate = (template) => {
  return callContainer({
    path: '/api/templates',
    method: 'POST',
    data: template,
  })
}

const listTemplates = () => {
  return callContainer({
    path: '/api/templates',
  })
}

const listRecordGroups = () => {
  return callContainer({
    path: '/api/records/groups',
  })
}

module.exports = {
  cloudEnv,
  cloudService,
  callContainer,
  createTemplate,
  listTemplates,
  listRecordGroups,
}
