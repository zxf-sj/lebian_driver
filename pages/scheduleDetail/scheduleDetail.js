// pages/scheduleDetail/scheduleDetail.js
import http from '../../utils/http';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      // 展示数据（从上一页传入或接口获取）
      TravelTimeDate: '',
      DriverName: '',
      DriverPhone: '',
      CarName: '',
      PassengerLineId_Name: '',
      TravelType: '',

      // 可编辑字段（初始可为空或默认值）
      ElectricityBill: '',
      ETC: ''
    },
    Id: '',
    activeTab:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.getData(options.Id)
    this.setData({
      Id: options.Id,
      activeTab:options.activeTab
    })
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
  getData(res) {
    console.log(res)
    let _this = this;
    let userInfo = wx.getStorageSync('userInfo')
    let MemberId = ''
    if (userInfo) {
      MemberId = userInfo.Id
    } else {
      wx.navigateTo({
        url: '/user_center/pages/login/login'
      })
    }
    let data = {
      "MemberId": MemberId,
      "Id": res
    }
    http.postRequest(
      "/api/RideTicketStatisticsDay/DispatchDetails",
      data,
      "",
      (res) => {
        console.log(res)
        if (res.code == 0) {
          _this.setData({
            formData: {
              CarName: res.data.CarName,
              Code: res.data.Code,
              DriverName: res.data.DriverName,
              DriverPhone: res.data.DriverPhone,
              Id: res.data.Id,
              PassengerLineId_Name: res.data.PassengerLineId_Name,
              TravelTimeDate: res.data.TravelTimeDate,
              TravelType: res.data.TravelType,
              ElectricityBill: res.data.ElectricityBill,
              ETC: res.data.ETC
            }
          })
        } else {
          wx.showToast({
            title: res.msg,
            icon: "none"
          })
        }
      },
      (err) => {
        wx.showToast({
          title: "网络出现问题",
          icon: "none"
        })
      }
    );
  },
  // 实时更新ETC
  onEtcFeeInput(e) {
    this.setData({
      ['formData.ETC']: e.detail.value
    });
  },
  // 实时更新电费
  onElectricityFeeInput(e) {
    this.setData({
      ['formData.ElectricityBill']: e.detail.value
    });
  },
  // 表单提交
  onSubmit(e) {
    let _this = this;
    console.log(e)
    const {
      ElectricityBill,
      ETC
    } = e.detail.value;
    let userInfo = wx.getStorageSync('userInfo')
    let MemberId = userInfo.Id
    // 校验
    if (!ElectricityBill && !ETC) {
      wx.showToast({
        title: '请至少填写一项费用',
        icon: 'none'
      });
      return;
    }
    let data = {
      MemberId,
      Id: _this.data.Id,
      ElectricityBill: parseFloat(ElectricityBill) || 0,
      ETC: parseFloat(ETC) || 0
    }
    http.postRequest(
      "/api/RideTicketStatisticsDay/UpdateDispatchETCAndElectricityBill",
      data,
      "",
      (res) => {
        console.log(res)
        if (res.code == 0) {
          wx.showToast({
            title: res.msg,
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: res.msg,
            icon: "none"
          })
        }
      },
      (err) => {
        wx.showToast({
          title: "网络出现问题",
          icon: "none"
        })
      }
    );
    // 提交到服务器（示例）
    // http.postRequest({
    //     '/api/RideTicketStatisticsDay/UpdateDispatchETCAndElectricityBill',
    //     method: 'POST',
    //     data: {
    //       ...this.data.formData,
    //       electricityFee: parseFloat(electricityFee) || 0,
    //       etcFee: parseFloat(etcFee) || 0
    //     },
    //     success(res) {
    //       wx.showToast({ title: '提交成功' });
    //       // 跳转或返回
    //       wx.navigateBack();
    //     },
    //     fail() {
    //       wx.showToast({ title: '提交失败', icon: 'none' });
    //     }
    //   });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

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