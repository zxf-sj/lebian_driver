// pages/busLineDetail/busLineDetail.js  第二套·历史班次详情
// TODO 待班车接口：详情接口未定，先用 MOCK 渲染，接口到位后只改 loadDetail()
const MOCK = {
  info: {
    from: '文水汽车站',
    to: '太原火车站',
    statusName: '已完成',
    stopTotal: 7,
    departFull: '2026-10-13 06:30 发车',
    plate: '晋JD88888',
    seatsTotal: 33,
    thisDepart: '06:30',
    thisArrive: '08:45',
    boarded: 4,
    booked: 6,
    empty: 28
  },
  stops: [
    { name: '桑村营村', isStart: true, time: '06:30', arrive: '06:30', boarded: 1, booked: 2 },
    { name: '文水汽车站', isStart: false, time: '06:48', arrive: '06:48', boarded: 1, booked: 2 },
    { name: '开栅镇', isStart: false, time: '07:08', arrive: '07:08', boarded: 1, booked: 1 },
    { name: '交城县', isStart: false, time: '07:28', arrive: '07:28', boarded: 1, booked: 1 },
    { name: '清徐县', isStart: false, time: '07:52', arrive: '07:52', boarded: 0, booked: 0 },
    { name: '太原南站', isStart: false, time: '08:22', arrive: '08:22', boarded: 0, booked: 0 },
    { name: '建南汽车站', isStart: false, time: '08:45', arrive: '08:45', boarded: 0, booked: 0 }
  ]
};

Page({
  data: {
    info: null,
    stops: []
  },

  onLoad(options) {
    this.loadDetail(options);
  },

  loadDetail(options) {
    // TODO 待班车接口：按 options（如班次 Id）查询真实历史班次详情
    this.setData({
      info: MOCK.info,
      stops: MOCK.stops
    });
  }
})
