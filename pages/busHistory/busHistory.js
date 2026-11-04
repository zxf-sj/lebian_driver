// pages/busHistory/busHistory.js  第二套·历史行程（接口 /api/BusMobile/GetBusDriverShiftPageList）
const BASE_URL = require("../../utils/BASE_URL");
var baseUrl = BASE_URL.BASE_URL //配置基础url

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function toNum(v, def) {
  const n = Number(v);
  return isNaN(n) ? (def || 0) : n;
}

// '2026-10-30 15:07:21' / '10-30' → { y, m, d, ts, md }
function parseDate(scheduleDate, departureTime) {
  let y = 0, m = 0, d = 0;
  const dt = String(departureTime || '');
  const ymd = dt.split(' ')[0];
  if (ymd) {
    const p = ymd.split('-');
    if (p.length === 3) {
      y = toNum(p[0]);
      m = toNum(p[1]);
      d = toNum(p[2]);
    }
  }
  const mdStr = String(scheduleDate || '');
  if ((!m || !d) && mdStr) {
    const p = mdStr.split('-');
    if (p.length >= 2) {
      m = toNum(p[p.length - 2]);
      d = toNum(p[p.length - 1]);
    }
  }
  if (!y) y = new Date().getFullYear();
  const date = (m && d) ? new Date(y, m - 1, d) : null;
  return {
    y, m, d,
    ts: date ? date.getTime() : 0,
    md: (m && d) ? (m + '-' + d) : '',
    label: (m && d) ? (m + '月' + d + '日 周' + WEEK[date.getDay()]) : (mdStr || '未知日期')
  };
}

// 状态：IsStart 0 待发车 / 1 已发车 / 2 已完成；优先用接口文案
function statusOf(s) {
  const name = s.IsStart_Name || '';
  const flag = toNum(s.IsStart, -1);
  if (name) {
    if (name.indexOf('取消') >= 0) return { text: name, cls: 'cancel' };
    if (name.indexOf('完成') >= 0) return { text: name, cls: 'done' };
    return { text: name, cls: 'doing' };
  }
  if (flag === 2) return { text: '已完成', cls: 'done' };
  if (flag === 1) return { text: '已发车', cls: 'doing' };
  return { text: '待发车', cls: 'wait' };
}

// 接口行 → 页面行
function normTrip(s) {
  const route = String(s.LineId_Name || '');
  const from = s.StatingLocation_Name || (route.split('-')[0] || '');
  const to = s.EndLocation_Name || (route.split('-')[1] || '');
  // LineId_Name 形如「太原-文水」：出发站落在前半段=去程，否则返程
  const head = route.split('-')[0] || '';
  const dir = (head && from.indexOf(head) >= 0) ? '去程' : '返程';
  const d = parseDate(s.ScheduleDate, s.DepartureTime);
  const st = statusOf(s);
  return {
    id: s.Id,
    time: String(s.Time || (s.DepartureTime || '').slice(11, 16)),
    from,
    to,
    plate: s.VehicleId_Name || '',
    dateLabel: d.md,
    dateText: d.label,
    ts: d.ts,
    dir,
    boarded: toNum(s.PersonNum) || toNum(s.SeatSold),
    seatsTotal: toNum(s.SeatTotal),
    empty: toNum(s.EmptySeat, toNum(s.SeatTotal) - toNum(s.PersonNum)),
    statusText: st.text,
    statusCls: st.cls
  };
}

// 按日期分组（保持接口顺序：新→旧）
function groupByDate(list) {
  const groups = [];
  const idx = {};
  list.forEach((it) => {
    const key = it.dateText;
    if (idx[key] === undefined) {
      idx[key] = groups.length;
      groups.push({ dateLabel: key, list: [] });
    }
    groups[idx[key]].list.push(it);
  });
  return groups;
}

Page({
  data: {
    summary: { trips7d: 0, totalPassengers: 0, occupancyRate: '0%' },
    groups: [],

    DriverId: '',
    pageIndex: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false,
    firstLoaded: false
  },

  // 已加载的全部班次（分组/统计都基于它，分页累加）
  _items: [],

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ DriverId: userInfo.Id || '' }, () => {
      this.refresh();
    });
  },

  // 从详情页返回不重复请求，下拉可手动刷新
  onPullDownRefresh() {
    this.refresh(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore) return;
    this.loadData(false);
  },

  refresh(cb) {
    this._items = [];
    this.setData({ pageIndex: 1, noMore: false, total: 0 }, () => {
      this.loadData(true, cb);
    });
  },

  loadData(isRefresh, cb) {
    const _this = this;
    if (this.data.loading) {
      cb && cb();
      return;
    }
    if (!this.data.DriverId) {
      this.setData({ loading: false, firstLoaded: true });
      wx.showToast({ title: '缺少司机ID，请重新登录', icon: 'none' });
      cb && cb();
      return;
    }
    const pageIndex = isRefresh ? 1 : (this.data.pageIndex + 1);
    this.setData({ loading: true });
    wx.request({
      url: baseUrl + '/api/BusMobile/GetBusDriverShiftPageList',
      data: {
        DriverId: this.data.DriverId,
        Today: '',            // 历史：不按今天过滤，取全部班次
        pageIndex: pageIndex,
        pageSize: this.data.pageSize
      },
      method: 'POST',
      success(res) {
        const d = res.data || {};
        console.log('[GetBusDriverShiftPageList] code=' + d.code + ' count=' + d.count + ' rows=' + ((d.data || []).length));
        if (d.code == 0) {
          const rows = (d.data || []).map(normTrip);
          _this._items = (isRefresh ? [] : _this._items).concat(rows);
          _this.setData({
            pageIndex: pageIndex,
            total: toNum(d.count, _this._items.length),
            noMore: rows.length < _this.data.pageSize,
            loading: false,
            firstLoaded: true
          });
          _this.applyData();
        } else if (d.code == 430) {
          // 没有数据
          _this.setData({ loading: false, noMore: true, firstLoaded: true });
          _this.applyData();
        } else {
          _this.setData({ loading: false, firstLoaded: true });
          wx.showToast({ title: d.msg || '加载失败', icon: 'none' });
        }
      },
      fail(err) {
        console.log(err);
        _this.setData({ loading: false, firstLoaded: true });
        wx.showToast({ title: err.errMsg || '网络异常', icon: 'none' });
      },
      complete() {
        cb && cb();
      }
    });
  },

  // 分组 + 近 7 天统计
  applyData() {
    const list = this._items || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const from = today - 6 * DAY_MS;

    let trips7d = 0, psg = 0, seats = 0;
    list.forEach((it) => {
      if (it.ts && it.ts >= from && it.ts <= today) {
        trips7d += 1;
        psg += it.boarded;
        seats += it.seatsTotal;
      }
    });

    this.setData({
      groups: groupByDate(list),
      summary: {
        trips7d: trips7d,
        totalPassengers: psg,
        occupancyRate: seats > 0 ? (Math.round((psg / seats) * 100) + '%') : '0%'
      }
    });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/busLineDetail/busLineDetail?id=' + id
    });
  }
})
