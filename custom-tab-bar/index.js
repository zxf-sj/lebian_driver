Component({
  properties: {
    // 第一套（调度司机）为缺省 dispatch；第二套（班车司机）传 bus
    mode: {
      type: String,
      value: 'dispatch'
    },
    // 第二套页面不是 tab 页，拿不到 getTabBar()，选中态由页面通过该属性传入
    activeIndex: {
      type: Number,
      value: 0,
      observer: function (val) {
        this.setData({
          selected: val
        })
      }
    }
  },
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#FF5722",
    // 第一套：订单 / 进行中 / 我的（tab 页，走 switchTab）
    list: [
      {
        pagePath: "/pages/index/index",
        iconPath: "/assets/images/dd0.png",
        selectedIconPath: "/assets/images/dd1.png",
        text: "订单"
      }, {
        pagePath: "/pages/underway/underway",
        iconPath: "/assets/images/jingxingzhon0.png",
        selectedIconPath: "/assets/images/jinxingzhon.png",
        text: "进行中"
      },
      {
        pagePath: "/pages/personalCenter/personalCenter",
        iconPath: "/assets/images/wd0.png",
        selectedIconPath: "/assets/images/wd1.png",
        text: "我的"
      }
    ],
    // 第二套：排班 / 历史 / 我的（非 tab 页，走 reLaunch）
    busList: [
      {
        pagePath: "/pages/busIndex/busIndex",
        iconPath: "/assets/images/pb0.png",
        selectedIconPath: "/assets/images/pb1.png",
        text: "排班"
      }, {
        pagePath: "/pages/busHistory/busHistory",
        iconPath: "/assets/images/ls0.png",
        selectedIconPath: "/assets/images/ls1.png",
        text: "历史"
      },
      {
        pagePath: "/pages/busMine/busMine",
        iconPath: "/assets/images/wd0.png",
        selectedIconPath: "/assets/images/wd1.png",
        text: "我的"
      }
    ]
  },
  observers: {
    'mode': function (mode) {
      this.setData({
        selectedColor: mode === 'bus' ? '#1B3A5C' : '#FF5722'
      })
    }
  },
  onShow() {

  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      if (data.mode === 'bus') {
        // 第二套页面未注册进 tabBar.list，switchTab 会失败，必须 reLaunch
        wx.reLaunch({ url });
      } else {
        wx.switchTab({ url });
      }
    }
  }
})
