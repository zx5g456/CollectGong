const api = require('../../../utils/api')

Component({
  data: {
    activeTemplateId: '',
    records: [],
    loadingRecords: false,
    exportingTemplateId: '',
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
    async onExportGroup(e) {
      const { id } = e.currentTarget.dataset

      if (this.data.exportingTemplateId) {
        return
      }

      this.setData({
        exportingTemplateId: id,
      })
      wx.showLoading({
        title: '导出中',
        mask: true,
      })

      try {
        const file = await api.exportRecords(id)
        await this.writeAndOpenExcel(file)
      } catch (error) {
        console.error('export records failed:', error)
        wx.showToast({
          title: '导出失败',
          icon: 'none',
        })
      } finally {
        wx.hideLoading()
        this.setData({
          exportingTemplateId: '',
        })
      }
    },
    writeAndOpenExcel(file) {
      return new Promise((resolve, reject) => {
        if (!file || !file.base64 || !file.fileName) {
          reject(new Error('导出文件数据为空'))
          return
        }

        const filePath = `${wx.env.USER_DATA_PATH}/${file.fileName}`
        const fs = wx.getFileSystemManager()

        fs.writeFile({
          filePath,
          data: file.base64,
          encoding: 'base64',
          success: () => {
            wx.openDocument({
              filePath,
              fileType: 'xlsx',
              showMenu: true,
              success: resolve,
              fail: reject,
            })
          },
          fail: reject,
        })
      })
    },
  },
})
