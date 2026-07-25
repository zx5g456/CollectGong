const api = require('../../../utils/api')

Component({
  data: {
    templateName: '',
    fieldTypes: [
      {
        label: '金额',
        value: 'number',
      },
      {
        label: '文本',
        value: 'text',
      },
      {
        label: '手机号',
        value: 'tel',
      },
    ],
    activeTypeIndex: 0,
    importTemplates: [],
    loadingImportTemplates: false,
    fields: [
      {
        id: 1,
        title: '',
        description: '',
        placeholder: '',
        type: 'number',
        required: true,
      },
    ],
  },
  lifetimes: {
    attached() {
      this.loadImportTemplates()
    },
  },
  methods: {
    normalizeImportTemplates(templates) {
      if (!Array.isArray(templates)) {
        return []
      }

      return templates
        .map((template) => {
          const source = template && (template.dataValues || template)
          const fields = source && Array.isArray(source.fields) ? source.fields : []

          if (!source || !source.id || !fields.length) {
            return null
          }

          return {
            ...source,
            name: source.name || source.templateName || '未命名模板',
            fields,
          }
        })
        .filter(Boolean)
    },
    async loadImportTemplates() {
      this.setData({
        loadingImportTemplates: true,
      })

      try {
        const remoteTemplates = this.normalizeImportTemplates(await api.listTemplates())
        if (remoteTemplates.length) {
          this.setData({
            importTemplates: remoteTemplates,
          })
          return
        }
      } catch (error) {
        console.error('load import templates failed:', error)
      } finally {
        this.setData({
          loadingImportTemplates: false,
        })
      }

      const localTemplates = this.normalizeImportTemplates(wx.getStorageSync('templates') || [])
      this.setData({
        importTemplates: localTemplates,
      })
    },
    hasDraftContent() {
      return !!this.data.templateName.trim()
        || this.data.fields.length > 1
        || this.data.fields.some((field) => (
          field.title || field.description || field.placeholder
        ))
    },
    applyImportedTemplate(template) {
      const importTime = Date.now()
      const fields = template.fields.map((field, index) => ({
        id: `import_${importTime}_${index}`,
        title: field.title || '',
        description: field.description || '',
        placeholder: field.placeholder || '',
        type: this.data.fieldTypes.some((item) => item.value === field.type)
          ? field.type
          : 'text',
        required: field.required !== false,
      }))

      this.setData({
        templateName: `${template.name}（副本）`,
        fields,
      })

      wx.showToast({
        title: '已导入，可继续修改',
        icon: 'none',
      })
    },
    onImportTemplate(e) {
      const template = this.data.importTemplates[Number(e.detail.value)]
      if (!template) {
        return
      }

      if (!this.hasDraftContent()) {
        this.applyImportedTemplate(template)
        return
      }

      wx.showModal({
        title: '导入已有模板',
        content: '导入后将覆盖当前尚未保存的编辑内容，是否继续？',
        confirmText: '继续导入',
        success: (result) => {
          if (result.confirm) {
            this.applyImportedTemplate(template)
          }
        },
      })
    },
    onTemplateNameInput(e) {
      this.setData({
        templateName: e.detail.value,
      })
    },
    onFieldInput(e) {
      const { index, key } = e.currentTarget.dataset
      this.setData({
        [`fields[${index}].${key}`]: e.detail.value,
      })
    },
    onRequiredChange(e) {
      const { index } = e.currentTarget.dataset
      this.setData({
        [`fields[${index}].required`]: e.detail.value,
      })
    },
    onTypeChange(e) {
      const { index } = e.currentTarget.dataset
      const typeIndex = Number(e.detail.value)
      const type = this.data.fieldTypes[typeIndex].value

      this.setData({
        [`fields[${index}].type`]: type,
      })
    },
    onAddAmountField() {
      const nextIndex = this.data.fields.length + 1
      const nextId = Date.now()

      this.setData({
        fields: this.data.fields.concat({
          id: nextId,
          title: '',
          description: '',
          placeholder: '',
          type: 'number',
          required: true,
        }),
      })
    },
    onRemoveField(e) {
      const { index } = e.currentTarget.dataset
      if (this.data.fields.length === 1) {
        wx.showToast({
          title: '至少保留一个字段',
          icon: 'none',
        })
        return
      }

      const fields = this.data.fields.filter((_, fieldIndex) => fieldIndex !== index)
      this.setData({
        fields,
      })
    },
    async onSaveTemplate() {
      const templateName = this.data.templateName.trim()
      const fields = this.data.fields.map((field) => ({
        ...field,
        title: field.title.trim(),
        description: field.description.trim(),
        placeholder: field.placeholder.trim(),
      }))

      if (!templateName) {
        wx.showToast({
          title: '请输入模板名称',
          icon: 'none',
        })
        return
      }

      const invalidField = fields.find((field) => !field.title)
      if (invalidField) {
        wx.showToast({
          title: '请填写字段标题',
          icon: 'none',
        })
        return
      }

      const templates = wx.getStorageSync('templates') || []
      const now = Date.now()
      const template = {
        id: `template_${now}`,
        name: templateName,
        fields,
        count: 0,
        updatedAt: this.formatTime(new Date(now)),
      }

      wx.showLoading({
        title: '保存中',
        mask: true,
      })

      try {
        const savedTemplate = await api.createTemplate(template)
        const nextTemplate = savedTemplate && savedTemplate.name ? savedTemplate : template

        wx.setStorageSync('templates', [nextTemplate].concat(templates))
        wx.showToast({
          title: '已保存',
          icon: 'success',
        })
      } catch (error) {
        console.error('save template failed:', error)
        wx.setStorageSync('templates', [template].concat(templates))
        wx.showToast({
          title: '已本地保存',
          icon: 'none',
        })
      } finally {
        wx.hideLoading()
      }
    },
    formatTime(date) {
      const formatNumber = (n) => {
        const value = n.toString()
        return value[1] ? value : `0${value}`
      }
      const year = date.getFullYear()
      const month = formatNumber(date.getMonth() + 1)
      const day = formatNumber(date.getDate())
      const hour = formatNumber(date.getHours())
      const minute = formatNumber(date.getMinutes())

      return `${year}/${month}/${day} ${hour}:${minute}`
    },
  },
})
