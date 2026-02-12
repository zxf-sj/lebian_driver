// user_center/pages/register/register.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name:"",
    phone:"",
    pwd:"",
    pwd1:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  bindName(e){
    var name = e.detail.value;
    this.setData({
      name:name
    })
  },
  bindPhone(e){
    var Phone = e.detail.value;
    this.setData({
      phone:Phone
    })
  },
  checkPhone(e){
    var phoneNumber = e.detail.value;
    if (!/^1[3456789]\d{9}$/.test(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    }
  },
  bindPwd(e){
    var pwd = e.detail.value;
    this.setData({
      pwd:pwd
    })
  },
  bindPwd1(e){
    var pwd1 = e.detail.value;
    this.setData({
      pwd1:pwd1
    })
  },
  register(){
    wx.showToast({
      title: '请联系管理员注册',
      icon:"none"
    })
  }
  
})