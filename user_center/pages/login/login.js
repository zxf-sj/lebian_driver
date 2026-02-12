const BASE_URL = require("../../../utils/BASE_URL");
var http = require('../../../utils/http.js');
const app = getApp();
Page({
  data: {
    agree:"",
    Phone:"",
    password:""
  },
  onLoad(){

  },
  onShow() {
    this.setData({
      hiddenLoading: true
    })
  },

  checkboxChange(e){
    const values = e.detail.value;
    this.setData({
      agree:values[0]
    })
  },
  gotoxieyi(){
    wx.navigateTo({
      url: '/user_center/pages/agreement/agreement',
    })
  },
  goyinsi(){
    wx.navigateTo({
      url: '/user_center/pages/yinsi/yinsi',
    })
  },
  bindPhone(e){
    var phoneNumber = e.detail.value;
    this.setData({
      Phone:phoneNumber
    })
  },
  checkPhone(e){
    var phoneNumber = e.detail.value;
    if (!/^1[3456789]\d{9}$/.test(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    }
  },
  bindPassword(e){
    var password = e.detail.value;
    this.setData({
      password:password
    })
  },
  register(){
    wx.navigateTo({
      url: '/user_center/pages/register/register',
    })
  },
  loginIn(){
    let that = this;
    if(!that.data.Phone){
      wx.showToast({
        title: '请输入手机号',
        icon:"none",
      })
      return false;
    }
    if(!that.data.password){
      wx.showToast({
        title: '请输入密码',
        icon:"none",
      })
      return false;
    }
    if(!that.data.agree){
      wx.showToast({
        title: '请勾选用户协议和隐私政策',
        icon:"none",
      })
      return false;
    }
    http.getRequest("/Api/DispatchMobile/loginDriverCar?tel="+that.data.Phone+"&pwd="+that.data.password,"", wx.getStorageSync('header'), res => {
      if(res.code==0){
        wx.setStorageSync('userInfo', res.data);
        wx.setStorageSync('carInfo', res.data.carInfo);
        wx.showToast({
          title: '登录成功',
          icon:'success',
          duration:2000,
          success:function(){
            setTimeout(function() { // 第三个toast显示1秒后跳转
              wx.switchTab({
                url: '/pages/index/index' // 目标页面的路径
              });
            }, 2000);
          }
        })

      }else{
        wx.showToast({
          title: res.msg,
          icon:'none'
        })
      }
    }, err => {
        console.log(2222)
    })
  }
})