const api = require('../../../utils/api')

Component({
  data: {
    activeTemplateId: '',
    records: [],
    loadingRecords: false,
    groups: [],
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
    async onOpenGroup(e) {
      const { id } = e.currentTarget.dataset

      if (this.data.activeTemplateId === id) {
        this.setData({
          activeTemplateId: '',
          records: [],
        })
        return
      }

      this.setData({
        activeTemplateId: id,
        records: [],
        loadingRecords: true,
      })

      try {
        const records = await api.listRecords(id)
        this.setData({
          records: this.normalizeRecords(records),
        })
      } catch (error) {
        console.error('load records failed:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          loadingRecords: false,
        })
      }
    },
    normalizeRecords(records) {
      if (!Array.isArray(records)) {
        return []
      }

      return records.map((record) => ({
        ...record,
        values: Array.isArray(record.values)
          ? record.values
          : Object.keys(record.data || {}).map((key) => ({
            key,
            label: key,
            value: record.data[key],
          })),
      }))
    },
  },
})
