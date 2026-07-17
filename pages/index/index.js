const api = require('../../utils/api')

Component({
  data: {
    loggingIn: false,
    loggedIn: false,
    actions: [
      {
        key: 'create',
        title: '创建模板',
        desc: '配置问卷字段，生成可重复使用的填写模板。',
        url: '/pages/templates/create/create',
      },
      {
        key: 'templates',
        title: '查看已有模板',
        desc: '管理已创建的模板，并分享给不同的人填写。',
        url: '/pages/templates/list/list',
      },
      {
        key: 'records',
        title: '查看收集信息',
        desc: '按照模板查看填写情况、填写人信息，并按时间排序。',
        url: '/pages/records/list/list',
      },
    ],
  },
  lifetimes: {
    attached() {
      const user = wx.getStorageSync('user')
      if (user && user.openid) {
        this.setData({
          loggedIn: true,
        })
      }
    },
  },
  methods: {
    async onWechatLogin() {
      if (this.data.loggingIn) {
        return
      }

      this.setData({
        loggingIn: true,
      })

      try {
        const user = await api.loginUser()
        wx.setStorageSync('user', user)
        this.setData({
          loggedIn: true,
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success',
        })
      } catch (error) {
        console.error('login user failed:', error)
        wx.showToast({
          title: '登录失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          loggingIn: false,
        })
      }
    },
    onOpenAction(e) {
      const { url } = e.currentTarget.dataset
      wx.navigateTo({
        url,
      })
    },
  },
})
