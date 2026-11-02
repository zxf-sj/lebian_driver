const BASE_URL = require("../../../utils/BASE_URL");
var baseUrl = BASE_URL.BASE_URL //配置基础url
var http = require('../../../utils/http.js');
const app = getApp();
Page({
  data: {
    agree: "",
    Phone: "",
    password: ""
  },
  onLoad() {

  },
  onShow() {
    this.setData({
      hiddenLoading: true
    })
  },

  checkboxChange(e) {
    const values = e.detail.value;
    this.setData({
      agree: values[0]
    })
  },
  gotoxieyi() {
    wx.navigateTo({
      url: '/user_center/pages/agreement/agreement',
    })
  },
  goyinsi() {
    wx.navigateTo({
      url: '/user_center/pages/yinsi/yinsi',
    })
  },
  bindPhone(e) {
    var phoneNumber = e.detail.value;
    this.setData({
      Phone: phoneNumber
    })
  },
  checkPhone(e) {
    var phoneNumber = e.detail.value;
    if (!/^1[3456789]\d{9}$/.test(phoneNumber)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
    }
  },
  bindPassword(e) {
    var password = e.detail.value;
    this.setData({
      password: password
    })
  },
  register() {
    wx.navigateTo({
      url: '/user_center/pages/register/register',
    })
  },
  loginIn() {
    let that = this;
    if (!that.data.Phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: "none",
      })
      return false;
    }
    if (!that.data.password) {
      wx.showToast({
        title: '请输入密码',
        icon: "none",
      })
      return false;
    }
    if (!that.data.agree) {
      wx.showToast({
        title: '请勾选用户协议和隐私政策',
        icon: "none",
      })
      return false;
    }
    http.getRequest("/Api/DispatchMobile/loginDriverCar?tel=" + that.data.Phone + "&pwd=" + that.data.password, "", wx.getStorageSync('header'), res => {
      console.log(res)
      wx.showToast({
        title: res.msg,
        icon: "none",
      })
      if (res.code == 0) {
        var driveType = res.data.DriveType;
        // 只认两种司机身份，其他值不落登录态，避免冷启动误入第一套
        if (driveType != '100004-0001360001' && driveType != '100004-0001360002') {
          wx.showModal({
            title: '提示',
            content: '该账号未开通对应端，请联系管理员',
            showCancel: false
          })
          return;
        }
        wx.setStorageSync('userInfo', res.data);
        wx.setStorageSync('carInfo', res.data.carInfo);
        setTimeout(function () { // 第三个toast显示1秒后跳转
          if (driveType == '100004-0001360001') {
            // 第一套：订单页（tab 页，用 switchTab）
            wx.switchTab({
              url: '/pages/index/index'
            });
          } else {
            // 第二套：排班页（非 tab 页，必须用 reLaunch）
            wx.reLaunch({
              url: '/pages/busIndex/busIndex'
            });
          }
        }, 2000);
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    }, err => {
      wx.showToast({
        title: err.msg,
        icon: 'success',
        duration: 2000,
      })
    })
  }
})