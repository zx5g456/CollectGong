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
    async loadTemplates() {
      const savedTemplates = wx.getStorageSync('templates') || []

      try {
        const remoteTemplates = await api.listTemplates()
        if (remoteTemplates && remoteTemplates.length) {
          this.setData({
            templates: remoteTemplates,
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
        templates: savedTemplates,
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
