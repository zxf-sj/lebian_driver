import http from '../../utils/http';
const app = getApp();
Page({
  data: {
    loadingFailed: false,
    loading: false,
    noMore: false,
    pageNo: 1,
    listData: null,
    menuTapCurrent:0,
    intervalId:null
  },
  onLoad: function (options) {
    if(options.menuTapCurrent==1){
      this.setData({
        menuTapCurrent:options.menuTapCurrent
      })
    }
    this.getOrderList(false);
    this.startInterval();
  },
  onUnload(){
    this.stopInterval();
  },
  onHide(){
    this.stopInterval();
  },
  startInterval(){
    this.data.intervalId = setInterval(() => {
      this.getOrderList(false);
    },5000); 
  },
  stopInterval: function() {
    clearInterval(this.data.intervalId); // 清除定时器
  },
  onShow(){
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    console.log('onShow')
    this.getOrderList(false);
  },
  //到达底部
  scrollToLower: function (e) {
    if (!this.data.loading && !this.data.noMore) {
      this.setData({
        loading: true,
        pageNo: this.data.pageNo + 1
      });
      this.getOrderList(true);
    }
  },
  // 查询订单
  getOrderList(isPage) {
    console.log('查询订单')
    let that = this;
    var usreinfo = wx.getStorageSync('userInfo');
    var where = "";
    if(that.data.menuTapCurrent==0){
      where = 0;
    }else{
      where = 1;
    }
    let data = {
      MemberId:usreinfo.Id,
      limit:10,
      page:that.data.pageNo,
      MenuId:where
    }
    http.postRequest("/api/RideTicketStatisticsDay/DriverDispatchOrder",data,"", res => {
      that.setData({
        loading: false
      })
      console.log(res)
      if(isPage){
        if (res.code == 0) {
          console.log(res.data,'1')
          var listData = res.data
          listData.forEach(function(item,index){
            listData[index].StartingTime = that.getNewtime(item.StartingTime)
          });
          console.log(this.data.listData.concat(listData),'2')
          that.setData({
            listData: this.data.listData.concat(listData)
          })
        }
      }else{
        console.log('查询订单z走的这里')
        if (res.code == 0) {
          var listData = res.data
          if(listData.length>0){
            listData.forEach(function(item,index){
              listData[index].StartingTime = that.getNewtime(item.StartingTime)
            });
            console.log(listData,'4')
            that.setData({
              listData:listData
            })
            if(that.data.menuTapCurrent==0){
              if(res.data[0].FormState!="100004-0000990006"){
                var orderId =listData[0]['Id'];
                wx.setStorageSync('orderId', orderId);
              }
            }
          }else{
            that.setData({
              noOrder:true
            })
          }
        }else if(res.code == 430){
          that.setData({
            listData:[],
            noOrder:true
          })
        } else{
          that.setData({
            noOrder:true,
          })
        }
      }
    }, err => {
      this.setData({
        loadingFailed: true
      })
      return false;
    })
  },
  getNewtime(originalDateTime){
    var dateString = originalDateTime.replace(/-/g, '/');
    var date = new Date(dateString);
    // 获取年月日
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    
    // 获取小时并向下取整
    var hour = String(date.getHours()).padStart(2, '0');
    var nextHour = String(date.getHours() + 1).padStart(2, '0');
    
    // 组合成时间区间格式
    return `${year}-${month}-${day} ${hour}:00-${nextHour}:00`;
  },
  menuTap:function(e){
    var current=e.currentTarget.dataset.current;//获取到绑定的数据
    this.setData({
      menuTapCurrent:current,
      listData:[],
      pageNo:1
    });
    this.getOrderList(false);
  },
  onPullDownRefresh(){
    wx.showNavigationBarLoading();
    this.setData({
      loading: true,
      listData:[],
      pageNo: 1
    });
    this.getOrderList(true,this.data.FormTypeId);
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh();
  },
  dispatchLDetail(e){
    var orderId = e.currentTarget.dataset.id;
    wx.setStorageSync('orderId', orderId);
    wx.switchTab({
      url: '/pages/underway/underway',
    })
  },
  orderDetail(e){
    var orderId = e.currentTarget.dataset.ids;
    wx.navigateTo({
      url: '/pages/detail/detail?orderId='+orderId,
    })
  },
  doYu(e){
    let that = this;
    var oid = e.currentTarget.dataset.ids;
    var status = '100004-0000990002';
    http.getRequest("/Api/DispatchMobile/changeDispatchState?id="+oid+"&status="+status,"","", res => {
      that.setData({
        loading: false
      })
      if(res.code==0){
        wx.showToast({
          title: '操作成功',
          icon:'none',
          direction:2000
        });
        that.getOrderList(false);
      }
    }, err => {
      wx.showToast({
        title:"网络出现问题",
        icon:"none"
      })
    })
  }
})