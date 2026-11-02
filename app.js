const BASE_URL = require("./utils/BASE_URL");


App({

  onLaunch(){
    this.hasUpdate();
  },
  onShow() {
  },
  onHide() {
  },

  globalData: {
    originCity: '', //定位城市
    originAddress: '', //定位地址
    originLongitude: 0, //定位经度
    originLatitude: 0, //定位纬度
    startCity: '', //起点市
    startCityAdcode: '', //起点区域代码
    strAddress: '', //选择的起点
    strLatitude: "", //起点纬度 
    strLongitude:"", //起点经度
    destinationCity: '', //终点地市
    destination: '', //终点地址
    endLatitude: 0, //终点纬度 
    endLongitude: 0, //终点经度
    clientDriving: null,
    friendDriver: null,
    nowOrFutureId: null,
    friendStartDate: null,
    scanDriverId: null,
    reqNotice: true,
    couponModal: false,
    lineCityCode: '',
    lineStartCity: '',
    lineStartAddress: '',
    lineStartLat: 0,
    lineStartLng: 0,
    lineEndAddress: '',
    lineEndLat: 0,
    lineEndLng: 0,
    exclusiveCarCityCode: '',
    exclusiveCarStartCity: '',
    hideCityNoService: true,
  },
  hasUpdate() {
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                }
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
          })
        }
      })
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  }
})