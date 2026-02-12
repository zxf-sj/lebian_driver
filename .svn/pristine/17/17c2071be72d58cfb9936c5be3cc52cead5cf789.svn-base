Component({
  properties:{
    activeIndex:{
      type:Number,
      value:0,
      observer:function(val){
        this.setData({
          selected:val
        })
      },
      t:{
        type:Object,
        value:{}
      }
    }
  },
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#FF5722",
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
   ]
  },
  onShow() {

  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url});
    }
  }
})