const api = require('../../../utils/api')

Page({
  data: {
    templates: [],
    deletingTemplateId: '',
  },

  onLoad() {
    this.loadTemplates()
  },

  onShow() {
    this.loadTemplates()
  },

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
          swipeOffset: 0,
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

  onOpenTemplate(e) {
    const { id } = e.currentTarget.dataset

    if (!id) {
      return
    }

    if (Date.now() < (this.ignoreTemplateTapUntil || 0)) {
      return
    }

    const template = this.data.templates.find((item) => `${item.id}` === `${id}`)
    if (template && template.swipeOffset) {
      this.closeSwipeActions()
      return
    }

    wx.navigateTo({
      url: `/pages/templates/fill/fill?templateId=${encodeURIComponent(id)}&preview=1`,
    })
  },

  getSwipeActionWidth() {
    return 144
  },

  getRpxRatio() {
    try {
      const windowInfo = wx.getWindowInfo
        ? wx.getWindowInfo()
        : wx.getSystemInfoSync()
      return 750 / windowInfo.windowWidth
    } catch (error) {
      return 2
    }
  },

  updateSwipeOffset(id, offset) {
    const index = this.data.templates.findIndex((item) => `${item.id}` === `${id}`)
    if (index < 0) {
      return
    }

    this.setData({
      [`templates[${index}].swipeOffset`]: offset,
    })
  },

  closeSwipeActions(exceptId = '') {
    const templates = this.data.templates.map((template) => ({
      ...template,
      swipeOffset: `${template.id}` === `${exceptId}` ? template.swipeOffset : 0,
    }))
    this.setData({
      templates,
    })
  },

  onTemplateTouchStart(e) {
    const touch = e.touches && e.touches[0]
    const { id } = e.currentTarget.dataset
    if (!touch || !id) {
      return
    }

    const template = this.data.templates.find((item) => `${item.id}` === `${id}`)
    this.closeSwipeActions(id)
    this.swipeGesture = {
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      initialOffset: template ? template.swipeOffset : 0,
      offset: template ? template.swipeOffset : 0,
      horizontal: false,
    }
  },

  onTemplateTouchMove(e) {
    const touch = e.touches && e.touches[0]
    const gesture = this.swipeGesture
    if (!touch || !gesture) {
      return
    }

    const deltaX = touch.clientX - gesture.startX
    const deltaY = touch.clientY - gesture.startY
    if (!gesture.horizontal && Math.abs(deltaX) <= Math.abs(deltaY)) {
      return
    }

    gesture.horizontal = true
    const actionWidth = this.getSwipeActionWidth()
    const offset = Math.max(0, Math.min(
      actionWidth,
      gesture.initialOffset - deltaX * this.getRpxRatio(),
    ))
    gesture.offset = offset
    this.updateSwipeOffset(gesture.id, offset)
  },

  onTemplateTouchEnd() {
    const gesture = this.swipeGesture
    if (!gesture) {
      return
    }

    if (gesture.horizontal) {
      const actionWidth = this.getSwipeActionWidth()
      this.updateSwipeOffset(
        gesture.id,
        gesture.offset >= actionWidth / 2 ? actionWidth : 0,
      )
      this.ignoreTemplateTapUntil = Date.now() + 300
    }
    this.swipeGesture = null
  },

  onShareTemplate() {},

  onDeleteTemplate(e) {
    const { id, name } = e.currentTarget.dataset

    if (!id || this.data.deletingTemplateId) {
      return
    }

    wx.showModal({
      title: '删除模板',
      content: `确定删除“${name}”吗？该模板及其全部收集信息将同时删除，且无法恢复。`,
      confirmText: '删除',
      confirmColor: '#e5484d',
      success: async (result) => {
        if (!result.confirm) {
          return
        }

        this.setData({
          deletingTemplateId: id,
        })

        try {
          const isLocalOnly = typeof id === 'string' && id.indexOf('template_') === 0
          if (!isLocalOnly) {
            await api.deleteTemplate(id)
          }

          const isDifferentTemplate = (template) => `${template.id || template._id}` !== `${id}`
          const templates = this.data.templates.filter(isDifferentTemplate)
          const savedTemplates = wx.getStorageSync('templates') || []

          this.setData({
            templates,
          })
          if (Array.isArray(savedTemplates)) {
            wx.setStorageSync('templates', savedTemplates.filter(isDifferentTemplate))
          }

          wx.showToast({
            title: '已删除',
            icon: 'success',
          })
        } catch (error) {
          console.error('delete template failed:', error)
          wx.showToast({
            title: error.message || '删除失败',
            icon: 'none',
          })
        } finally {
          this.setData({
            deletingTemplateId: '',
          })
        }
      },
    })
  },

  onShareAppMessage(res) {
    const dataset = res && res.target ? res.target.dataset : {}
    const templateId = dataset.id || ''
    const templateName = dataset.name || '问卷模板'
    const path = `/pages/templates/fill/fill?templateId=${encodeURIComponent(templateId)}`

    console.log('share template path:', path)

    return {
      title: `请填写：${templateName}`,
      path,
      imageUrl: '/assets/share-logo.png',
    }
  },
})
