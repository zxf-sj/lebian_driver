import http from '../../utils/http';
const app = getApp();
Page({
  data: {
    orderId:"",
    infos:{},
    list:[],
    etcValue: '', // 输入框的值
    electricityValue:'',
    textareaValue:''
  },
  onLoad(options) {
      var orderId = options.orderId;
      this.setData({
        orderId:orderId
      })
      this.getInfos();
  },
  // 监听输入变化
  onEctInput(e) {
    this.setData({
      etcValue: e.detail.value
    });
  },
  onElectricityInput(e) {
    this.setData({
      electricityValue: e.detail.value
    });
  },
  onInput(e) {
    this.setData({
      textareaValue: e.detail.value
    });
  },
  // 提交按钮点击
  handleSubmit() {
    let _this = this;
    let userInfo = wx.getStorageSync('userInfo')
    let data = {
      MemberId:userInfo.Id,
      Id:_this.data.orderId,
      ETC:_this.data.etcValue,
      ElectricityBill:_this.data.electricityValue,
      Note:_this.data.textareaValue
    }
    http.postRequest("/api/RideTicketStatisticsDay/UpdateDriverDispatchOrder?",data,"", res => {
      if(res.code==0){
        console.log(res)
        wx.showToast({ title: '提交成功', icon: 'success' });
      }else{
        wx.showToast({
          title: res.msg,
          icon:'none',
          duration:2000
        })
      }
    }, err => {
      wx.showToast({
        title:"出现错误请重试",
        icon:'none',
        duration:2000
      })
    })
  },

  callPhone(e) {
    console.log(e.currentTarget.dataset.tel)
    wx.showModal({
      title: '提示',
      content: '确认是否跳转去拨号？',
      success (res) {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.tel, // 必须是字符串，自动过滤非数字字符（如 -、空格）
            success: () => {
              console.log('用户已拨号');
            },
            fail: (err) => {
              console.error('拨号失败', err);
              wx.showToast({ title: '拨号失败', icon: 'none' });
            }
          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
   
  },
  getInfos(){
    let that = this;
    console.log('????????',that.data.orderId)
    http.getRequest("/Api/DispatchMobile/getDispatchOrderDetail?orderId="+that.data.orderId,"","", res => {
      if(res.code==0){
        console.log(res)
        that.setData({
          etcValue: res.data.ETC, // 输入框的值
          electricityValue:res.data.ElectricityBill,
          textareaValue:res.data.Note
        })
        var list = res.data.detailList;
        console.log(list)
        list.forEach(function(items,index){
          if(items.PersonalIds != null) {
            var str = items.PersonalIds;
            list[index]['userList'] = str.split(",") // 按逗号分割成 ["15835800774|武英浩", "15835800774|武思亮"]
            .map(item => {
              const [phone, name] = item.split("|"); // 按 | 分割 phone 和 name
              return { name, phone }; // 返回对象
            });
            console.log(2131,items.ArrivalTime);
            console.log(123123,that.getNewtime(items.ArrivalTime));
            list[index].ArrivalTime = that.getNewtime(items.ArrivalTime);
          }
        })
        console.log(list);
        that.setData({
          infos:res.data,
          list:list
        })
      }else{
        wx.showToast({
          title: res.msg,
          icon:'none',
          duration:2000
        })
      }
    }, err => {
      wx.showToast({
        title:"出现错误请重试",
        icon:'none',
        duration:2000
      })
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
  callUser(e){
    var tel = e.currentTarget.dataset.tel;
    wx.makePhoneCall({
      phoneNumber: tel,
    })
  },
  cashPay(e){
    var order_id = e.currentTarget.dataset.ids;
    console.log(order_id);
    let that = this;
    http.getRequest("/Api/DispatchMobile/CashPay?Id="+order_id,"","", res => {
      if(res.code==0){
        wx.showToast({
          title: '操作成功',
          icon:'success',
          duration:2000
        })
        that.getInfos();
      }else{
        wx.showToast({
          title: res.msg,
          icon:'none',
          duration:2000
        })
      }
    }, err => {
      wx.showToast({
        title:"出现错误请重试",
        icon:'none',
        duration:2000
      })
    })
  }
})