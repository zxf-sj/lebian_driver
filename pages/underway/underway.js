const BASE_URL = require("../../utils/BASE_URL");
var baseUrl = BASE_URL.BASE_URL //配置基础url
import http from '../../utils/http.js';
import qqmapsdk from '../../libs/qqMap';
import bmap from '../../libs/bmap-wx'
let SCREEN_WIDTH = 750;
const app = getApp();
let RATE = wx.getWindowInfo().screenHeight / wx.getWindowInfo().screenWidth;
Page({
  data: {
    scale: 15,
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 550,
    longitude: '',
    latitude: '',
    markers: [],
    points: [],
    selected: 0,
    orderId: "",
    dispatchInfo: "",
    orderInfo: "",
    isshow: false,
    kong:false
  },
  onLoad: function (opt) {
    let _this = this;
    // _this.getOrderInfo();

  },

  onShow() {
    let _this = this;
    _this.getOrderInfo();
    var BMap = new bmap.BMapWX({
      // ak: 'MnTm62X4dihvBjjN0FBtlgFkG0kTHpAx'
      key:'FD2Wvwuq8uRaFgheLXBn13U'
    });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    // BMap.search({
    //   "query": '酒店',
    //   success: function(data) {
    //     // data.wxMarkerData 已经是包含多个标注点的数组
    //     console.log(data)
    //     _this.setData({
    //       markers: data.wxMarkerData,
    //       // 将地图中心点移动到第一个标注点
    //       latitude: data.wxMarkerData[0].latitude,
    //       longitude: data.wxMarkerData[0].longitude
    //     });
    //   },
    //   fail: function(data) {
    //     console.log('检索失败', data);
    //   }
    // });
  },
  // 驾车路线
  // driving(str1, str2, end1, end2) {
  //   var _this = this;
  //   //调用距离计算接口
  //   qqmapsdk.direction({
  //     mode: 'driving', //可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
  //     //from参数不填默认当前地址
  //     from: {
  //       'latitude': str1,
  //       'longitude': str2
  //     },
  //     to: {
  //       'latitude': end1,
  //       'longitude': end2
  //     },
  //     success: function (res) {
  //       var ret = res;
  //       var coors = ret.result.routes[0].polyline,
  //         pl = [];
  //       //坐标解压（返回的点串坐标，通过前向差分进行压缩）
  //       var kr = 1000000;
  //       for (var i = 2; i < coors.length; i++) {
  //         coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
  //       }
  //       //将解压后的坐标放入点串数组pl中
  //       for (var i = 0; i < coors.length; i += 2) {
  //         pl.push({
  //           latitude: coors[i],
  //           longitude: coors[i + 1]
  //         })
  //       }
  //       let _points = [{
  //         latitude: parseFloat(str1),
  //         longitude: parseFloat(str2)
  //       }, {
  //         latitude: parseFloat(end1),
  //         longitude: parseFloat(end2)
  //       }]

  //       _this.setData({
  //         polyline: [{
  //           points: pl,
  //           color: '#3091e0DD',
  //           width: 4,
  //           arrowLine: true
  //         }]
  //       })

  //       _this.mapCtx.includePoints({
  //         padding: [120],
  //         points: _points,
  //       })
  //     },
  //     fail: function (error) {
  //       console.log(error);
  //     }
  //   });
  // },
  //定位当前位置
  getMyLocation() {
    var _self = this
    wx.getLocation({
      type: "wgs84",
      success(res) {
       
    let requests = res.longitude + "," + res.latitude
    _self.setData({
      latitude: res.latitude,
      longitude: res.longitude
    })
    return
    wx.request({
      url: baseUrl + '/api/MapWebApi/GeoConv',
      data: {
        LatLngs: requests,
        Model: 1,
      },
      method: "POST",
      success: (res2) => {
        console.log(res2.data.data)
        console.log(res2.data.data[0].Item1)
        console.log(res2.data.data[0].Item2)
        _self.setData({
          latitude: res2.data.data[0].Item1,
          longitude: res2.data.data[0].Item2
        })
      },
      fail(err) {
        console.log(err)
        wx.hideLoading()
      }
    })
      },
      fail(err) {
        console.log(err);
      }
    })
    
  },
  chufa(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '是否确认出发',
      success(res) {
        if (res.confirm) {
          var oid = that.data.orderId;
          var status = "100004-0000990003";
          var list = that.data.orderInfo;
          console.log(list)
          for (var i = 0; i < list.length; i++) {
            if (list[i].FormState != '100004-0001020006') {
              var tel = list[i].Personal_Phone;
              wx.showToast({
                title: "有乘客还未上车",
                icon: "none",
              })
              return false;
            } else {
              continue;
            }
          }
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
              that.getOrderInfo();
            }
          }, err => {
            wx.showToast({
              title: "网络出现问题",
              icon: "none"
            })
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  daoda(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '是否到达',
      success(res) {
        if (res.confirm) {
          var oid = that.data.orderId;
          var status = "100004-0000990004";
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
              that.getOrderInfo();
            }
          }, err => {
            wx.showToast({
              title: "网络出现问题",
              icon: "none"
            })
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  huadong(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '是否确认完成行程？',
      success(res) {
        if (res.confirm) {
          var oid = that.data.orderId;
          var status = "100004-0000990005";
          var list = that.data.orderInfo;
          console.log('list',list)
          for (var i = 0; i < list.length; i++) {
            if(list[i].FormState != '100004-0001020004') {
              if (list[i].FormState != '100004-0001020007') {
                //var tel = list[i].Personal_Phone;
                wx.showToast({
                  title: "还有乘客还还未下车",
                  icon: "none",
                })
                return false;
              } else {
                continue;
              }
            }
           
          }
          // http.getRequest("/Api/DispatchMobile/changeDispatchState?id=" + oid + "&status=" + status , "", "", res => {
          //   that.setData({
          //     loading: false
          //   })
          //   if (res.code == 0) {
          //     wx.showModal({
          //       title: '提示',
          //       content: '操作成功，是否去充电',
          //       success(res) {
          //         if (res.confirm) {
          //           that.chongdian();
          //           that.getOrderInfo();
          //         } else if (res.cancel) {
          //           that.getOrderInfo();
          //         }
          //       }
          //     })
          //   }
          // }, err => {
          //   wx.showToast({
          //     title: "网络出现问题",
          //     icon: "none"
          //   })
          // })
          wx.scanCode({
            success(res) {
              console.log('扫码成功', res);
              // res.result 是扫码结果（如 URL、文本、二维码内容等）
              // res.scanType 是扫码类型，例如 QR_CODE、EAN_13 等
              http.getRequest("/Api/DispatchMobile/changeDispatchState?id=" + oid + "&status=" + status + "&carname=" + res.result, "", "", res => {
                that.setData({
                  loading: false
                })
                if (res.code == 0) {
                  wx.showModal({
                    title: '提示',
                    content: '操作成功，是否去充电',
                    success(res) {
                      if (res.confirm) {
                        that.chongdian();
                        that.getOrderInfo();
                      } else if (res.cancel) {
                        that.getOrderInfo();
                      }
                    }
                  })
                } else if (res.code == 400) {
                  wx.showToast({
                    title: res.msg,
                    icon: "none"
                  })
                } else {
                  wx.showToast({
                    title: res.msg,
                    icon: "none"
                  })
                }
              }, err => {
                wx.showToast({
                  title: res.msg,
                  icon: "none"
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
  chongdian() {
    let that = this;
    var carInfo = wx.getStorageSync('carInfo');
    var status = '100004-0000510001';
    http.getRequest("/Api/DispatchMobile/changeCarStatus?carId=" + carInfo.Id + "&status=" + status, "", "", res => {
      that.setData({
        loading: false
      })
      wx.showToast({
        title: '操作成功',
        icon: 'none'
      })
    }, err => {
      wx.showToast({
        title: "网络出现问题",
        icon: "none"
      })
    })
  },
  fanhui() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  getOrderInfo() {
    console.log('99999999999')
    let that = this;
    var orderId = wx.getStorageSync('orderId');
    // var orderId = '300214-9a19d38b46f241e1b6074897a93e742e'
    that.setData({
      orderId: orderId
    })
    console.log('orderId', orderId)
    if (orderId) {
      http.getRequest("/api/RideTicketStatisticsDay/getWxDispatchOrderDetail?orderId=" + orderId, "", "", res => {
        console.log(res)
        that.setData({
          loading: false
        })
        if (res.code == 0) {
          if(res.data.detailList) {
            res.data.StartingTime = that.getNewtime(res.data.StartingTime);
          
          var markers = [];
          var list = res.data.detailList;
          console.log(list)
          that.setData({
            dispatchInfo: res.data,
            orderInfo: res.data.detailList,
            isshow: true,
            longitude:list[0].IntoLongitude,
            latitude:list[0].IntoLatitude
          })
          list.forEach((value, index) => {
            console.log(value)
            markers.push({
              id: 1,
              title: '天安门',
              latitude: value.IntoLatitude,
              longitude: value.IntoLongitude,
              iconPath:'/assets/images/chengke.png'
            })
          })
          console.log(markers)
          that.setData({
            markers:markers
          })
          } else {
            console.log('空单')
            that.setData({
              kong:true,
              isshow: true
            })
          }
          
        } else if (res.code == 400) {
          that.setData({
            isshow: false
          })
        } else {

          wx.showToast({
            title: res.msg,
            icon: "none"
          })
        }
      }, err => {
        this.setData({
          loadingFailed: true
        })
        return false;
      })
    } else {
      that.setData({
        isshow: false
      })
    }
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
  showNote(e) {
    var note = e.currentTarget.dataset.note;
    console.log(note);
    wx.showToast({
      title: note,
      icon: 'none',
      direction: 2000
    })
  },
  shangche(e) {
    let that = this;
    var oid = e.currentTarget.dataset.oid;
    var did = e.currentTarget.dataset.did;
    var status = "100004-0001020006";
    http.getRequest("/Api/DispatchMobile/changeRideTicketState?rideId=" + oid + "&status=" + status + "&dispatchId=" + did, "", "", res => {
      that.setData({
        loading: false
      })
      if (res.code == 0) {
        wx.showToast({
          title: '操作成功',
          icon: 'none',
          direction: 2000
        });
        that.getOrderInfo();
      }
    }, err => {
      wx.showToast({
        title: "网络出现问题",
        icon: "none"
      })
    })
  },
  xiache(e) {
    let that = this;
    var oid = e.currentTarget.dataset.oid;
    var did = e.currentTarget.dataset.did;
    var status = "100004-0001020007";
    http.getRequest("/Api/DispatchMobile/changeRideTicketState?rideId=" + oid + "&status=" + status + "&dispatchId=" + did, "", "", res => {
      that.setData({
        loading: false
      })
      if (res.code == 0) {
        wx.showToast({
          title: '操作成功',
          icon: 'none',
          direction: 2000
        });
        that.getOrderInfo();
      }
    }, err => {
      wx.showToast({
        title: "网络出现问题",
        icon: "none"
      })
    })
  },
  goDetail(e) {
    var oid = e.currentTarget.dataset.oid;
    wx.navigateTo({
      url: '/pages/detail/detail?orderId=' + oid
    })
  },
  goIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  call(e) {
    var tel = e.currentTarget.dataset.tel;
    wx.makePhoneCall({
      phoneNumber: tel //仅为示例，并非真实的电话号码
    })
  },
  showPic(e) {
    let that = this;
    var markers = [];
    console.log(e.currentTarget)
    let data = e.currentTarget.dataset
    var lati = data.lait;
    var long = data.long;
    var address = data.address
    var mark = {
      id: 0,
      latitude: lati,
      longitude: long,
      iconPath: '/assets/images/chengke.png',
      width: 30,
      height: 30,
      callout: {
        content: "cghe", //文本
        bgColor: "#fff", //背景色
        padding: "10px 30px", //文本边缘留白
        borderRadius: "15px", //边框圆角
        borderWidth: "1px", //边框宽度
        borderColor: "#ccc", //边框颜色
        color: '#000', //文字颜色
        textAlign: 'center', //对其方式,
        display: 'ALWAYS', //常显  BYCLICK点击显示
      }
    };
    console.log(data)
    if (data.ispickgoods == '100004-0000010001') {
      let TakeOverGoodsTel = data.takeovergoodstel.slice(-4);
      let DeliverGoodsTel = data.delivergoodstel.slice(-4);
      mark.callout.content = "寄件" + DeliverGoodsTel + "_收件" + TakeOverGoodsTel + "\n" + "终点：" + address;
    } else {
      var phone = data.tel;
      var address = data.address
      var arr = phone.split(',');
      var str = arr[0];
      var arr1 = str.split("|");
      var nums = arr1[0];
      mark.callout.content = "尾号" + nums.slice(-4) + "\n" + "终点：" + address;
    }

    markers.push(mark)
    that.setData({
      markers: markers,
      latitude: lati,
      longitude: long
    })
  },
  shuaxin() {
    let that = this;
    var markers = wx.getStorageSync('markers');
    that.setData({
      markers: markers
    })
    wx.removeStorageSync('markers');
  }
})