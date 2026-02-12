import http from '../../utils/http.js';
import qqmapsdk from '../../libs/qqMap';
Page({
  data: {
    infos:{},
    longitude:"",
    latitude:"",
    markers:[],
    controls:[],
    carId:""
  },
  onLoad(options) {
    var carId = options.carId;
    this.setData({
      carId:carId
    })
    this.getCarInfo();
  },
  onShow() {

  },
  getCarInfo(){
    let that = this;
    http.getRequest("/Api/DispatchMobile/getCarInfos?carId="+that.data.carId,"","", res => {
      if(res.code==0){
        var marker ={
          id: 0,
          latitude: res.data.Latitude,
          longitude: res.data.Longitude,
          iconPath: '/assets/images/car.png',
          width: 30,
          height: 30,
          callout: {
            content: "当前位置", //文本
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
        var markers =[];
        markers.push(marker);
        that.setData({
          infos:res.data,
          latitude:res.data.Latitude,
          longitude:res.data.Longitude,
          markers:markers,
        })
      }else{
        wx.showToast({
          title: res.msg,
          icon:"none"
        })
      }
    }, err => {

    })
  }
})