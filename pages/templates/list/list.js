const api = require('../../../utils/api')

Component({
  data: {
    shareTemplate: null,
    templates: [
      {
        id: 'visitor',
        name: '来访登记',
        count: 18,
        updatedAt: '2026/07/16 09:30',
      },
      {
        id: 'activity',
        name: '活动报名',
        count: 42,
        updatedAt: '2026/07/15 18:10',
      },
    ],
  },
  lifetimes: {
    attached() {
      this.loadTemplates()
    },
  },
  pageLifetimes: {
    show() {
      this.loadTemplates()
    },
  },
  methods: {
    toTemplateArray(value) {
      if (Array.isArray(value)) {
        return value
      }

      if (!value || typeof value !== 'object') {
        return []
      }

      if (Array.isArray(value.data)) {
        return value.data
      }

      if (Array.isArray(value.list)) {
        return value.list
      }

      if (Array.isArray(value.templates)) {
        return value.templates
      }

      if (value.name || value.templateName || value.title) {
        return [value]
      }

      return []
    },
    normalizeTemplates(templates) {
      return this.toTemplateArray(templates)
        .map((template, index) => {
          const source = template && (template.dataValues || template)
          if (!source) {
            return null
          }

          const name = source.name || source.templateName || source.title || ''
          const count = source.count === undefined || source.count === null ? 0 : source.count
          const updatedAt = source.updatedAt || source.latestAt || source.displayUpdatedAt || ''

          return {
            ...source,
            id: source.id || source._id || `template_${index}`,
            name: name || '未命名模板',
            count,
            updatedAt: updatedAt || '暂无时间',
          }
        })
        .filter((template) => template && template.id)
    },
    async loadTemplates() {
      const savedTemplates = wx.getStorageSync('templates') || []

      try {
        const remoteTemplates = await api.listTemplates()
        const normalizedRemoteTemplates = this.normalizeTemplates(remoteTemplates)
        if (normalizedRemoteTemplates.length) {
          this.setData({
            templates: normalizedRemoteTemplates,
          })
          return
        }
      } catch (error) {
        console.error('load templates failed:', error)
      }

      const normalizedSavedTemplates = this.normalizeTemplates(savedTemplates)
      if (!normalizedSavedTemplates.length) {
        if (savedTemplates && !Array.isArray(savedTemplates)) {
          wx.removeStorageSync('templates')
        }
        return
      }

      this.setData({
        templates: normalizedSavedTemplates,
      })
    },
    onShareTemplate() {},
    onShareAppMessage(res) {
      const dataset = res && res.target ? res.target.dataset : {}
      const templateId = dataset.id || ''
      const templateName = dataset.name || '问卷模板'

      return {
        title: `请填写：${templateName}`,
        path: `/pages/templates/fill/fill?templateId=${templateId}`,
      }
    },
  },
})
