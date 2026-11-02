// pages/start/start.js
var timer;
const driverType = require('../../utils/driverType.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    num:5,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.Numdown();
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  skipOpenPage(){
    clearTimeout(timer);
    this.goHome();
  },
  // 冷启动按身份分流：班车司机永远进第二套，其余进第一套
  goHome(){
    var userInfo = wx.getStorageSync('userInfo');
    if(userInfo){
      if(driverType.isBusDriver()){
        wx.reLaunch({
          url: '/pages/busIndex/busIndex',
        })
      }else{
        wx.reLaunch({
          url: '/pages/index/index',
        })
      }
    }else{
      wx.reLaunch({
        url: '/user_center/pages/login/login',
      })
    }
  },
  Numdown: function() {
    var that = this;
    var num = that.data.num;
    timer = setTimeout(function() {
      that.setData({
        num: num - 1
      })
      that.endNum()
    }, 1000)
  },
  endNum: function() {
    var that = this;
    var num = that.data.num;
    if (num == 0) {
      clearTimeout(timer);
      that.goHome();
    } else {
      that.Numdown()
    }
  },
  /*
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    clearTimeout(timer);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    clearTimeout(timer);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})