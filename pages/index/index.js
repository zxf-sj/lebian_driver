import http from '../../utils/http';

var bmap = require('../../libs/bmap-wx.min');
const BASE_URL = require("../../utils/BASE_URL");
var baseUrl = BASE_URL.BASE_URL //配置基础url
/**
 * 计算两点之间的距离（单位：米）
 * @param {Number} lat1 起点纬度
 * @param {Number} lng1 起点经度
 * @param {Number} lat2 终点纬度
 * @param {Number} lng2 终点经度
 */
function getDistance(lat1, lng1, lat2, lng2) {
  var dis = 0;
  var radLat1 = lat1 * Math.PI / 180.0;
  var radLat2 = lat2 * Math.PI / 180.0;
  var a = radLat1 - radLat2;
  var b = (lng1 * Math.PI / 180.0) - (lng2 * Math.PI / 180.0);
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * 6378.137; // 地球半径 (km)
  s = Math.round(s * 10000) / 10; // 转为米并保留一位小数
  return s;
}
const app = getApp();
const driverType = require('../../utils/driverType.js');
Page({
  data: {
    loadingFailed: false,
    loading: false,
    noMore: false,
    pageNo: 1,
    listData: null,
    menuTapCurrent: 0,
    intervalId: null
  },
  onLoad: function (options) {
    if (driverType.blockBusDriver()) return; // 班车司机禁止进入第一套
    if (options.menuTapCurrent == 1) {
      this.setData({
        menuTapCurrent: options.menuTapCurrent
      })
    }
    this.getOrderList(false);
    this.startInterval();
    this.startLocationWatch()
  },
  onUnload() {
    this.stopInterval();
  },
  onHide() {
    this.stopInterval();
  },
  startInterval() {
    // this.data.intervalId = setInterval(() => {
    //   console.log('2')
    //   this.getOrderList(false);
    // },5000); 
  },
  stopInterval: function () {
    clearInterval(this.data.intervalId); // 清除定时器
  },
  onShow() {
    if (driverType.blockBusDriver()) return; // 班车司机禁止进入第一套
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    console.log('onShow')
    this.getOrderList(false);
  },
  onUnload() {
    // 3. 页面卸载时，务必停止定位以节省电量
    wx.stopLocationUpdate();
  },
  //到达底部
  scrollToLower: function (e) {
    console.log('4564656')
    if (!this.data.loading && !this.data.noMore) {
      this.setData({
        loading: true,
        pageNo: this.data.pageNo + 1
      });
      this.getOrderList(true);
    }
  },
  // 开始监听位置变化
  startLocationWatch() {
    var BMap = new bmap.BMapWX({
      ak: 'MnTm62X4dihvBjjN0FBtlgFkG0kTHpAx'
    });

    let lastLat = 0;
    let lastLng = 0;
    //位置变化了
    wx.startLocationUpdate({
      accuracy: 'high', // 建议用 high，否则 Android 可能会忽略 interval
      interval: 10000, // Android 设为 10秒，iOS 无效但无害
      success: (res) => {
        console.log(res)
        wx.onLocationChange((res) => {
          console.log('位置变化:', res);
          // 1. 如果是第一次，直接记录
          if (lastLat === 0) {
            lastLat = res.latitude;
            lastLng = res.longitude;
            return;
          }

          // 2. 调用自定义函数计算距离
          const distance = getDistance(lastLat, lastLng, res.latitude, res.longitude);

          // 3. 过滤：如果移动小于 10 米，直接返回，不执行后续请求
          if (distance < 5000) {
            console.log('漂移忽略，距离:', distance);
            return;
          }

          // 4. 超过 10 米，更新基准点并执行你的业务逻辑
          console.log('有效移动:', distance);
          lastLat = res.latitude;
          lastLng = res.longitude;

          console.log('✅ 满足条件，开始请求接口...');
          let requests = lastLng + "," + lastLat;
          wx.request({
            url: baseUrl + '/api/MapWebApi/GeoConv',
            data: {
              LatLngs: requests,
              Model: 1,
            },
            method: "POST",
            success: (res1) => {
              console.log("转换过的坐标", res1)
              BMap.regeocoding({
                location: res1.data.data[0].Item1 + ',' + res1.data.data[0].Item2, // 格式必须是 "纬度,经度"
                // 成功回调
                success: function (res2) {
                  console.log('逆地址解析', res2, res2.originalData)
                  if (res2.originalData.status === 0) {
                    console.log(res2)
                    // res.wxMarkerData 是一个数组，通常取第一个结果
                    var result = res2.wxMarkerData[0];

                    // 获取详细地址
                    var address = result.address;
                    // 获取周边商圈（如：天安门，王府井）
                    var business = result.business;
                    // 获取位置描述（如：某某大厦南100米）
                    var desc = result.desc;
                    console.log('详细地址:', address);
                    console.log('周边商圈:', business);
                    let userInfo = wx.getStorageSync('userInfo')
                    let carInfo = wx.getStorageSync('carInfo')
                    let data = {
                      TruckId: userInfo.Id,
                      DriverId: carInfo.Id,
                      code: "Android",
                      Longitude: res1.data.data[0].Item2,
                      Latitude: res1.data.data[0].Item1,
                      Address: address
                    }
                    http.postRequest(
                      "/Api/DispatchMobile/saveMobilePosition",
                      data,
                      "",
                      (res) => {
                        console.log(res)
                      },
                      (err) => {
                        wx.showToast({
                          title: "网络出现问题",
                          icon: "none"
                        })
                      }
                    );
                  } else {
                    console.error('逆地址解析失败:', res.message);
                  }
                }.bind(this), // 注意绑定 this 指向，否则 setData 会报错

                // 失败回调
                fail: function (res) {
                  console.error('请求失败:', res);
                }
              });
            },
            fail(err) {
              console.log(err)
              wx.hideLoading()
            }
          })
        });
      },
      fail: (err) => {
        console.error('开启位置更新失败:', err);
        wx.showToast({
          title: '请开启定位权限',
          icon: 'none'
        });
      }
    });
  },


  // 查询订单
  getOrderList(isPage) {
    console.log('查询订单')
    let that = this;
    var usreinfo = wx.getStorageSync('userInfo');
    var where = "";
    if (that.data.menuTapCurrent == 0) {
      where = 0;
    } else {
      where = 1;
    }
    let data = {
      MemberId: usreinfo.Id,
      limit: 10,
      page: that.data.pageNo,
      MenuId: where
    }
    http.postRequest("/api/RideTicketStatisticsDay/DriverDispatchOrder", data, "", res => {
      that.setData({
        loading: false
      })
      console.log(res)
      if (isPage) {
        if (res.code == 0) {
          console.log(res.data, '1')
          var listData = res.data
          listData.forEach(function (item, index) {
            listData[index].StartingTime = that.getNewtime(item.StartingTime)
          });
          console.log(this.data.listData.concat(listData), '2')
          that.setData({
            listData: this.data.listData.concat(listData)
          })
        }
      } else {
        console.log('查询订单z走的这里')
        if (res.code == 0) {
          var listData = res.data
          if (listData.length > 0) {
            listData.forEach(function (item, index) {
              listData[index].StartingTime = that.getNewtime(item.StartingTime)
            });
            console.log(listData, '4')
            that.setData({
              listData: listData
            })
            if (that.data.menuTapCurrent == 0) {
              if (res.data[0].FormState != "100004-0000990006") {
                var orderId = listData[0]['Id'];
                wx.setStorageSync('orderId', orderId);
              }
            }
          } else {
            that.setData({
              noOrder: true
            })
          }
        } else if (res.code == 430) {
          that.setData({
            listData: [],
            noOrder: true
          })
        } else {
          that.setData({
            noOrder: true,
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
  getNewtime(originalDateTime) {
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
  menuTap: function (e) {
    var current = e.currentTarget.dataset.current; //获取到绑定的数据
    this.setData({
      menuTapCurrent: current,
      listData: [],
      pageNo: 1
    });
    this.getOrderList(false);
  },
  onPullDownRefresh() {
    wx.showNavigationBarLoading();
    this.setData({
      loading: true,
      listData: [],
      pageNo: 1
    });
    this.getOrderList(true, this.data.FormTypeId);
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh();
  },
  dispatchLDetail(e) {
    var orderId = e.currentTarget.dataset.id;
    wx.setStorageSync('orderId', orderId);
    wx.switchTab({
      url: '/pages/underway/underway',
    })
  },
  orderDetail(e) {
    var orderId = e.currentTarget.dataset.ids;
    wx.navigateTo({
      url: '/pages/detail/detail?orderId=' + orderId,
    })
  },
  doYu(e) {
    let that = this;
    var oid = e.currentTarget.dataset.ids;
    var status = '100004-0000990002';
    http.getRequest("/Api/DispatchMobile/changeDispatchState?id=" + oid + "&status=" + status, "", "", res => {
      that.setData({
        loading: false
      })
      if (res.code == 0) {
        wx.showToast({
          title: '操作成功',
          icon: 'none',
          direction: 2000
        });
        that.getOrderList(false);
      }
    }, err => {
      wx.showToast({
        title: "网络出现问题",
        icon: "none"
      })
    })
  }
})