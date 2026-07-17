Component({
  data: {
    templateName: '费用登记',
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
    fields: [
      {
        id: 1,
        title: '面额100元',
        description: '无需则填0；需要则填写金额（元）',
        placeholder: '10000',
        type: 'number',
        required: true,
      },
    ],
  },
  methods: {
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
          title: `面额${nextIndex}00元`,
          description: '无需则填0；需要则填写金额（元）',
          placeholder: '0',
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
    onSaveTemplate() {
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

      wx.setStorageSync('templates', [template].concat(templates))
      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
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
