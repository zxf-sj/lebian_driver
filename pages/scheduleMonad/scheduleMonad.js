// pages/scheduleMonad/scheduleMonad.js
import http from '../../utils/http';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dataList: [],
    activeTab: 'today',
    loading: false,
    noMore: false,
    loadingFailed: false,
    pageNo: 1,
    InvoiceState: 0,
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
    this.getList()
  },
  switchTab(e) {
    let _this = this;
    const tab = e.currentTarget.dataset.tab;
    _this.setData({
      activeTab: tab,
      InvoiceState: tab == 'today' ? 0 : 1,
      dataList:[],
      pageNo:1,
      noMore: false
    });
    _this.getList();
  },
  handleItem(e) {
    console.log(e)
    wx.navigateTo({
      url: '/pages/scheduleDetail/scheduleDetail?Id='+ e.currentTarget.dataset.id + '&activeTab=' + e.currentTarget.dataset.activetab,
    })
  },
  getList() {
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
    // "300038-f7f2e9c6a895468ab9d597544473854b"
    let data = {
      "MemberId": MemberId,
      "InvoiceState": _this.data.InvoiceState,
      "limit": 10,
      "page": _this.data.pageNo
    }
    http.postRequest(
      "/api/RideTicketStatisticsDay/DispatchList",
      data,
      "",
      (res) => {
        console.log(res)
        if (res.code == 0) {
          let dataList = []
          if(_this.data.pageNo > 1) {
            dataList = [..._this.data.dataList,...res.data]
          } else {
            dataList = res.data
          }
          _this.setData({
            dataList,
            loading:false
          })
        } else if (res.code == 430) {
          _this.setData({
            loading:false,
            noMore: true
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
  //到达底部
  scrollToLower: function (e) {
    let _this = this;
    if (!this.data.loading && !this.data.noMore) {
      _this.setData({
        loading: true,
        pageNo: _this.data.pageNo + 1
      });
      this.getList();
    }
  },
  menuTap: function (e) {
    console.log(e)
    var current = e.currentTarget.dataset.current; //获取到绑定的数据
    this.setData({
      menuTapCurrent: current,
      listData: [],
      pageNo: 1
    });
    this.getOrderList(true, this.data.FormTypeId);
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