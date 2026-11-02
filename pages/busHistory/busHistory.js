// pages/busHistory/busHistory.js  第二套·历史
// TODO 待班车接口：项目现无班车历史接口，数据先用 MOCK，接口到位后只改 loadData()
const MOCK_SUMMARY = {
  trips7d: 2,
  totalPassengers: 9,
  occupancyRate: '14%'
};

const MOCK_GROUPS = [
  {
    dateLabel: '10月13日',
    list: [
      {
        id: 'h001', time: '13:30', from: '太原火车站', to: '文水汽车站',
        dateLabel: '10-13', dir: '返程', boarded: 4, seatsTotal: 33, empty: 29,
        statusText: '已完成'
      },
      {
        id: 'h002', time: '06:30', from: '文水汽车站', to: '太原火车站',
        dateLabel: '10-13', dir: '去程', boarded: 5, seatsTotal: 33, empty: 28,
        statusText: '已完成'
      }
    ]
  }
];

Page({
  data: {
    summary: MOCK_SUMMARY,
    groups: MOCK_GROUPS
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    // TODO 待班车接口：替换为真实历史行程查询（近7天趟次 / 总载客 / 上座率 / 分组列表）
    this.setData({
      summary: MOCK_SUMMARY,
      groups: MOCK_GROUPS
    });
  },

  openDetail(e) {
    wx.navigateTo({
      url: '/pages/busLineDetail/busLineDetail?id=' + e.currentTarget.dataset.id
    });
  }
})
