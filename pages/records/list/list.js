const api = require('../../../utils/api')

Component({
  data: {
    groups: [
      {
        id: 'visitor',
        name: '来访登记',
        count: 18,
        latestAt: '2026/07/16 09:30',
      },
      {
        id: 'activity',
        name: '活动报名',
        count: 42,
        latestAt: '2026/07/15 18:10',
      },
    ],
  },
  lifetimes: {
    attached() {
      this.loadRecordGroups()
    },
  },
  pageLifetimes: {
    show() {
      this.loadRecordGroups()
    },
  },
  methods: {
    async loadRecordGroups() {
      try {
        const groups = await api.listRecordGroups()
        if (groups && groups.length) {
          this.setData({
            groups,
          })
        }
      } catch (error) {
        console.error('load record groups failed:', error)
      }
    },
  },
})
