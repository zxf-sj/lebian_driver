// pages/busMine/busMine.js  第二套·我的
const http = require('../../utils/http.js');

Page({
  data: {
    userinfo: {},
    avatarText: '司',
    carinfo: {},
    certCount: 0 // TODO 待班车接口：证件数量
  },

  onLoad() {
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.reLaunch({ url: '/user_center/pages/login/login' });
    }
  },

  onShow() {
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.reLaunch({ url: '/user_center/pages/login/login' });
      return;
    }
    this.setData({
      userinfo: userInfo,
      avatarText: (userInfo.Name || '司').charAt(0),
      carinfo: wx.getStorageSync('carInfo') || {}
    });
    this.getCarInfo();
  },

  getCarInfo() {
    let that = this;
    var carInfo = wx.getStorageSync('carInfo');
    if (!carInfo || !carInfo.Id) return;
    http.getRequest('/Api/DispatchMobile/getCarInfos?carId=' + carInfo.Id, '', '', res => {
      if (res.code == 0) {
        that.setData({ carinfo: res.data });
        wx.setStorageSync('carInfo', res.data);
      }
    }, err => {
      wx.showToast({ title: '网络出现问题', icon: 'none' });
    });
  },

  editName() {
    let that = this;
    wx.showModal({
      title: '修改姓名',
      editable: true,
      placeholderText: '请输入姓名',
      success(res) {
        if (res.confirm && res.content) {
          var userInfo = wx.getStorageSync('userInfo');
          userInfo.Name = res.content;
          wx.setStorageSync('userInfo', userInfo);
          // TODO 待班车接口：姓名变更需同步服务端时替换为接口调用
          that.setData({
            userinfo: userInfo,
            avatarText: res.content.charAt(0)
          });
        }
      }
    });
  },

  editCar() {
    // TODO 待班车接口：班车车辆配置页未定，暂走通用车辆信息页
    var carInfo = wx.getStorageSync('carInfo');
    if (!carInfo || !carInfo.Id) {
      wx.showToast({ title: '暂无车辆信息', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/carinfo/carinfo?carId=' + carInfo.Id });
  },

  uploadCert() {
    // TODO 待班车接口：证件上传
    wx.showToast({ title: '待班车接口', icon: 'none' });
  },

  loginOut() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function (sm) {
        if (sm.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('carInfo');
          wx.removeStorageSync('orderId');
          wx.reLaunch({
            url: '/user_center/pages/login/login',
          });
        }
      }
    });
  }
})
