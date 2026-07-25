const api = require('../../../utils/api')

Component({
  data: {
    activeTemplateId: '',
    records: [],
    loadingRecords: false,
    exportingTemplateId: '',
    deletingRecordId: '',
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
        this.setData({
          groups: Array.isArray(groups) ? groups : [],
        })
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

      return records.map((record) => {
        const values = Array.isArray(record.values)
          ? record.values
          : Object.keys(record.data || {}).map((key) => ({
            key,
            label: key,
            value: record.data[key],
          }))

        return {
          ...record,
          values,
          displayValues: values.slice(0, 3),
          hiddenValueCount: Math.max(values.length - 3, 0),
          expanded: false,
        }
      })
    },
    onToggleRecord(e) {
      const { id } = e.currentTarget.dataset

      this.setData({
        records: this.data.records.map((record) => {
          if (record.id !== id || !record.hiddenValueCount) {
            return record
          }

          const expanded = !record.expanded
          return {
            ...record,
            expanded,
            displayValues: expanded ? record.values : record.values.slice(0, 3),
          }
        }),
      })
    },
    confirmDelete() {
      return new Promise((resolve) => {
        wx.showModal({
          title: '删除提交信息',
          content: '删除后无法恢复，且后续导出的 Excel 中将不再包含这条信息。',
          confirmText: '删除',
          confirmColor: '#e5484d',
          success: (result) => resolve(!!result.confirm),
          fail: () => resolve(false),
        })
      })
    },
    async onDeleteRecord(e) {
      const { id } = e.currentTarget.dataset

      if (this.data.deletingRecordId || !id) {
        return
      }

      const confirmed = await this.confirmDelete()
      if (!confirmed) {
        return
      }

      this.setData({
        deletingRecordId: id,
      })

      try {
        await api.deleteRecord(id)
        this.setData({
          records: this.data.records.filter((record) => record.id !== id),
        })
        await this.loadRecordGroups()
        wx.showToast({
          title: '已删除',
          icon: 'success',
        })
      } catch (error) {
        console.error('delete record failed:', error)
        wx.showToast({
          title: error.message || '删除失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          deletingRecordId: '',
        })
      }
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
