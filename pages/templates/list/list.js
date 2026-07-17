const api = require('../../../utils/api')

Component({
  data: {
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
    normalizeTemplates(templates) {
      return templates
        .map((template, index) => {
          const source = template && (template.dataValues || template)
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
        if (remoteTemplates && remoteTemplates.length) {
          this.setData({
            templates: this.normalizeTemplates(remoteTemplates),
          })
          return
        }
      } catch (error) {
        console.error('load templates failed:', error)
      }

      if (!savedTemplates.length) {
        return
      }

      this.setData({
        templates: this.normalizeTemplates(savedTemplates),
      })
    },
    onShareTemplate(e) {
      const { name } = e.currentTarget.dataset
      wx.showToast({
        title: `分享${name}`,
        icon: 'none',
      })
    },
  },
})
