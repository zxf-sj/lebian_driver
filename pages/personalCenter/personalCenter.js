import http from '../../utils/http';
const BASE_URL = require("../../utils/BASE_URL");
var baseUrl = BASE_URL.BASE_URL //配置基础url
const driverType = require('../../utils/driverType.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
      userinfo:{},
      carinfo:{},
      statusArr:[
        {
        "name":"运营",
        "status":"100004-0000510002"
        },
        {
        "name":"充电",
        "status":"100004-0000510001"
        },
        {
        "name":"维修",
        "status":"100004-0000510004"
        },
        {
        "name":"休息",
        "status":"100004-0000510003"
        },
      ],
      statusIndex:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (driverType.blockBusDriver()) return; // 班车司机禁止进入第一套
    var userInfo = wx.getStorageSync('userInfo');
    if(!userInfo){
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
    }
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
    if (driverType.blockBusDriver()) return; // 班车司机禁止进入第一套
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
    var userInfo = wx.getStorageSync('userInfo');
    if(!userInfo){
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
    }else{
      this.getCarInfo();
      this.setData({
        userinfo :userInfo
      })
    }
  },
  bindwx() {
    let userInfo = wx.getStorageSync('userInfo')
    if(!userInfo) {
      console.log('没登录')
      return
    }
    wx.login({
      success (res) {
        if (res.code) {
          console.log(res)
          //发起网络请求
          wx.request({
            url: baseUrl + '/api/DriverApp/BindWeChat',
            data: {
              code:res.code,
              Id:userInfo.Id
            },
            method: "POST",
            success: (data) => {
              console.log(data)
              wx.showToast({
                title: data.data.msg,
                icon:'none'
              })
             
            },
            fail(err) {
              console.log(err)
              wx.hideLoading()
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  handlecarpai() {
    let _this = this;
    let userInfo = wx.getStorageSync('userInfo')
    wx.showModal({
      title: '提示',
      content: '是否扫码绑定车牌？',
      success(res) {
        if (res.confirm) {
          wx.scanCode({
            success(res) {
              console.log('扫码成功', res);
              let data =  {
                "Id":userInfo.Id,
                "Name":res.result
            }
              http.postRequest("/api/DriverApp/ChangeDriverNo",data,"", res2 => {
              wx.setStorageSync('carInfo', res2.data.carInfo)
              wx.setStorageSync('userInfo', res2.data)
              _this.setData({
                carinfo:res2.data.carInfo
              })
              }, err => {
                wx.showToast({
                  title:"网络出现问题",
                  icon:"none"
                })
              })
            },
            fail(err) {
              console.error('扫码失败', err);
            }
          });

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  getCarInfo(){
    let that = this;
    var carInfo  = wx.getStorageSync('carInfo');
    http.getRequest("/Api/DispatchMobile/getCarInfos?carId="+carInfo.Id,"","", res => {
      that.setData({
        loading: false
      })
      if(res.code==0){
        var status =  res.data.StatusId;
        var arr = that.data.statusArr;
        var statusIndex = 0;
        arr.forEach((item,index)=>{
          if(item.status==status){
            statusIndex = index;
          }
        });
        that.setData({
          carinfo:carInfo,
          statusIndex:statusIndex
        })
        wx.setStorageSync('carInfo', res.data);
      }
    }, err => {
      wx.showToast({
        title:"网络出现问题",
        icon:"none"
      })
    })
  },
  loginOut(){
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
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  carInfo(){
    var carInfo = wx.getStorageSync('carInfo');
    console.log(carInfo.Id);
    wx.navigateTo({
      url: '/pages/carinfo/carinfo?carId='+carInfo.Id,
    })
  },
  goCoupon() {
    console.log('跳转')
    wx.navigateTo({
      url: '/pages/scheduleMonad/scheduleMonad',
    })
  },
  bindPickerChange(e){
    let that = this;
    var index = e.detail.value;
    var arr = that.data.statusArr;
    var carInfo = wx.getStorageSync('carInfo');
    var status = arr[index].status;
    if(status !=  carInfo.StatusId){
      http.getRequest("/Api/DispatchMobile/changeCarStatus?carId="+carInfo.Id+"&status="+status,"","", res => {
        that.setData({
          loading: false
        })
        if(res.code==0){
          that.getCarInfo();
        }
      }, err => {
        wx.showToast({
          title:"网络出现问题",
          icon:"none"
        })
      })
    }
  }
})