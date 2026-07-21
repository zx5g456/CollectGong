const api = require('../../../utils/api')

Page({
  data: {
    templateId: '',
    template: null,
    fields: [],
    formData: {},
    loading: true,
    submitting: false,
  },

  onLoad(options) {
    const templateId = options.templateId || ''

    console.log('fill page options:', options)

    this.setData({
      templateId,
    })

    this.loadTemplate(templateId)
  },

  async loadTemplate(templateId) {
    if (!templateId) {
      console.warn('fill page missing templateId')
      this.setData({
        loading: false,
      })
      return
    }

    try {
      const template = await api.getTemplate(templateId)
      const fields = Array.isArray(template.fields) ? template.fields : []
      this.setData({
        template,
        fields,
        loading: false,
      })
    } catch (error) {
      console.error('load shared template failed:', error)
      this.setData({
        loading: false,
      })
      wx.showToast({
        title: '模板加载失败',
        icon: 'none',
      })
    }
  },

  onInputChange(e) {
    const { fieldId } = e.currentTarget.dataset
    this.setData({
      [`formData.${fieldId}`]: e.detail.value,
    })
  },

  async onSubmit() {
    if (this.data.submitting) {
      return
    }

    const missingField = this.data.fields.find((field) => (
      field.required && !this.data.formData[field.id]
    ))

    if (missingField) {
      wx.showToast({
        title: `请填写${missingField.title}`,
        icon: 'none',
      })
      return
    }

    this.setData({
      submitting: true,
    })
    wx.showLoading({
      title: '提交中',
      mask: true,
    })

    try {
      await api.submitRecord({
        templateId: this.data.templateId,
        data: this.data.formData,
      })
      wx.showToast({
        title: '已提交',
        icon: 'success',
      })
      this.setData({
        formData: {},
      })
    } catch (error) {
      console.error('submit record failed:', error)
      wx.showToast({
        title: '提交失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
      this.setData({
        submitting: false,
      })
    }
  },
})
