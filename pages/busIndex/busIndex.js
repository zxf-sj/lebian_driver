// pages/busIndex/busIndex.js  第二套·排班页
const BASE_URL = require("../../utils/BASE_URL");
const util = require("../../utils/util.js");
var baseUrl = BASE_URL.BASE_URL //配置基础url

// 列表固定查全部班次（StartType：999 全部 / 0 待发车 / 1 已发车）
const START_TYPE_ALL = 999;

Page({
  data: {
    topData: null,
    ongoing: {
      from: '',
      to: '',
    },
    showList: [],
    DriverId: '',
    pageIndex: 1,
    pageSize: 20,
    loading: false,
    noMore: false,
    isShow:true,
  },

  onLoad() {
    let userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ DriverId: userInfo.Id });
  },

  onShow() {
    this.getOngoingShuttleBus();
    this.refreshList();
  },

  getOngoingShuttleBus() {
    wx.showLoading({
      title: '加载中',
    })
    let _this = this;
    let userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo) {
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
    }
    let request = {
      DriverId: userInfo.Id
    }
    wx.request({
      url: baseUrl + '/api/BusMobile/GetBusDriverTodayStartInfo',
      data: request,
      method: "POST",
      success: (res) => {
        console.log(res)
        if (res.data.code == 0) {
          let data = res.data.data || {};
          let parts = (data.LineId_Name || '').split('-');
          _this.setData({
            topData: data,
            isShow:true,
            ongoing: {
              from: parts[0] || '',
              to: parts[1] || ''
            }
          })
        } else if(res.data.code == 430){
          _this.setData({
            isShow:false
          })
        } else {
          wx.showToast({
            title: res.data.msg,
            icon: 'error',
            duration: 2000
          })
        }
      },
      fail(err) {
        console.log(err)
        wx.showToast({
          title: err.errMsg,
          icon: 'error',
          duration: 2000
        })
      },
      complete() {
        wx.hideLoading()
        console.log('请求结束')
      }
    })
  },
 
  refreshList() {
    this.setData({ showList: [], pageIndex: 1, noMore: false, loading: false });
    this.getdataList();
  },

  // scroll-view 触底：上拉加载下一页
  onScrollToLower() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ pageIndex: this.data.pageIndex + 1 });
    this.getdataList();
  },

  // IsStart：0 待发车 / 1 已发车 / 2 已完成
  markWaiting(item) {
    item.IsWaiting = item.IsStart == 0;
    return item;
  },

  getdataList() {
    if (this.data.loading) return;
    let _this = this;
    _this.setData({ 
      loading: true,
      showList:[]
     });
    let request = {
      "DriverId": _this.data.DriverId,
      "pageIndex": _this.data.pageIndex,
      "pageSize": _this.data.pageSize,
      "Today": util.getToday()
    }
    wx.request({
      url: baseUrl + '/api/BusMobile/GetBusDriverShiftPageList',
      data: request,
      method: "POST",
      success: (res) => {
        console.log(res)
        if (res.data.code == 0) {
          let rows = (_this.data.pageIndex > 1 ? _this.data.showList : []).concat(
            (res.data.data || []).map(_this.markWaiting)
          );
          _this.setData({
            showList: rows,
            loading: false,
            // 返回不满一页视为没有下一页；若接口有 total 可改用 _this.pickTotal 精确判断
            noMore: (res.data.data || []).length < _this.data.pageSize
          });
        } else if (res.data.code == 430) {
          _this.setData({ loading: false, noMore: true });
        } else {
          _this.setData({ loading: false });
          wx.showToast({
            title: res.data.msg,
            icon: 'error',
            duration: 2000
          })
        }
      },
      fail(err) {
        console.log(err)
        _this.setData({ loading: false });
        wx.showToast({
          title: err.errMsg,
          icon: 'error',
          duration: 2000
        })
      }
    })
  },

  // 待发车 →「发车」：确认后调发车接口
  startBus(e) {
    let _this = this;
    let item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '提示',
      content: '是否执行' + item.DepartureTime + ' ' + item.LineId_Name + ' 的班次？',
      success(res) {
        if (res.confirm) {
          _this.departure(item.Id)
        }
      }
    })
  },

  // 已发车 →「去执行」：进入执行页
  goExecute(e) {
    let item = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item) || {};
    console.log(item)
    let topData = this.data.topData || {};
    let ScheduleId = item.Id || topData.Id || topData.ScheduleId || '';
    wx.navigateTo({
      url: '/pages/busOngoingDetail/busOngoingDetail?ScheduleId=' + ScheduleId,
    })
  },

  // 已完成 / 点卡片空白处 →「详情」
  goDetail() {
    // TODO 待班车接口：详情页目前渲染 MOCK，接口到位后带 id 过去
    wx.navigateTo({
      url: '/pages/busLineDetail/busLineDetail',
    })
  },

  departure(ScheduleId) {
    let _this = this;
    let request = {
      ScheduleId:ScheduleId
    }
    wx.request({
      url: baseUrl + '/api/BusMobile/UpdateDriverShiftState',
      data: request,
      method: "POST",
      success: (res) => {
        console.log(res)
        if (res.data.code == 0) {
          console.log(res)
          _this.getOngoingShuttleBus()
          // 发车成功后刷新列表，卡片才会从「待发车·发车」变成「已发车·去执行」
          _this.refreshList()
        } else if(res.data.code == 430){
          _this.setData({
            isShow:false
          })
        } else {
          wx.showToast({
            title: res.data.msg,
            icon: 'error',
            duration: 2000
          })
        }
      },
      fail(err) {
        console.log(err)
        wx.showToast({
          title: err.errMsg,
          icon: 'error',
          duration: 2000
        })
      },
      complete() {
        wx.hideLoading()
        console.log('请求结束')
      }
    })
  }
})
