// pages/busOngoingDetail/busOngoingDetail.js  第二套·进行中班次详情（订单维度）
const BASE_URL = require("../../utils/BASE_URL");
const throttle = require('../../utils/throttle.js').throttle;
var baseUrl = BASE_URL.BASE_URL //配置基础url

// 订单状态只有：已上车 / 未上车（待确认）
const STATUS_BOARDED = 'boarded';
const STATUS_WAIT = 'wait';

const ORDER_TABS = [
  { key: STATUS_WAIT, name: '未上车', count: 0 },
  { key: STATUS_BOARDED, name: '已上车', count: 0 }
];

/* ===================== 取值工具 ===================== */
function pick(obj, keys) {
  if (!obj) return '';
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickArr(obj, keys) {
  if (!obj) return [];
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function pickObj(obj, keys) {
  if (!obj) return {};
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  }
  return {};
}

function toNum(v, d) {
  var n = Number(v);
  return isNaN(n) ? (d || 0) : n;
}

function toBool(v) {
  return (v === true || v === 1 || v === '1' || v === 'true');
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function numOrRaw(v) {
  var n = Number(v);
  return (v !== '' && v !== undefined && v !== null && !isNaN(n)) ? n : v;
}

// 14:50 / 2026-10-29 14:50:00 → 14:50
function fmtTime(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return s.length > 5 ? s.slice(0, 5) : s;
  return pad2(Number(m[1])) + ':' + m[2];
}

function shortId(id) {
  var s = String(id || '');
  return s.length > 8 ? s.slice(-8) : s;
}

/* ===================== 状态归一 ===================== */
// OrderStatus_Name：已预约/已上车/未上车…；名称识别不出时按 OrderStatus 数值（0=已预约）
function statusFromName(name, val) {
  var s = String(name || '');
  if (s.indexOf('未上车') >= 0 || s.indexOf('未乘') >= 0) return STATUS_WAIT;
  if (s.indexOf('上车') >= 0 || s.indexOf('已完成') >= 0) return STATUS_BOARDED;
  var n = Number(val);
  if (val !== '' && val !== null && val !== undefined && !isNaN(n)) {
    return n > 0 ? STATUS_BOARDED : STATUS_WAIT;
  }
  return STATUS_WAIT;
}

// 乘客明细：{Name, Code(电话), IDCard}
function normPax(raw) {
  raw = raw || {};
  return {
    Name: pick(raw, ['Name', 'PassengerName', 'username']) || '',
    Phone: pick(raw, ['Code', 'Phone', 'phone', 'Tel', 'Mobile']) || '',
    IDCard: pick(raw, ['IDCard', 'IdCard']) || '',
    Status: STATUS_WAIT,
    StatusName: '未上车'
  };
}

// 订单：{orderId, TicketNum, OrderStatus, OrderStatus_Name, list[], customer{}}
function normOrder(raw, i) {
  raw = raw || {};
  var paxList = pickArr(raw, ['list', 'List', 'PaxList', 'PassengerList', 'Passengers', 'TicketList']).map(normPax);
  var personNum = toNum(pick(raw, ['TicketNum', 'PersonNum', 'SeatNum', 'Num', 'PeopleNum']), paxList.length);
  if (!personNum && paxList.length) personNum = paxList.length;

  var customer = pickObj(raw, ['customer', 'Customer', 'Member', 'member']);
  var phone = pick(customer, ['phone', 'Phone', 'Tel', 'Mobile']) ||
    pick(raw, ['Phone', 'phone', 'Tel', 'Mobile']) ||
    (paxList[0] && paxList[0].Phone) || '';
  var contact = pick(customer, ['username', 'userName', 'Name', 'RealName']) ||
    (paxList[0] && paxList[0].Name) || '';

  var status = statusFromName(
    pick(raw, ['OrderStatus_Name', 'Status_Name', 'StatusName']),
    pick(raw, ['OrderStatus', 'Status', 'State'])
  );
  var boardNum = toNum(pick(raw, ['PersonNum', 'BoardNum', 'BoardedNum', 'GetOnNum']), 0);
  if (!boardNum) boardNum = status === STATUS_BOARDED ? personNum : 0;
  if (boardNum > personNum) boardNum = personNum;
  if (status === STATUS_BOARDED) {
    for (var k = 0; k < paxList.length; k++) {
      paxList[k].Status = STATUS_BOARDED;
      paxList[k].StatusName = '已上车';
    }
  }

  var isMulti = paxList.length > 1 || personNum > 1;
  var orderId = String(pick(raw, ['orderId', 'OrderId', 'OrderID', 'Id', 'id']) || '');

  return {
    Key: 'od' + i,
    OrderId: orderId,
    OrderNo: orderId,
    OrderNoShort: shortId(orderId),
    IsMulti: isMulti,
    PersonNum: personNum,
    BoardNum: boardNum,
    Status: status,
    StatusName: status === STATUS_BOARDED ? '已上车' : '未上车',
    StatusRaw: pick(raw, ['OrderStatus_Name', 'Status_Name']) || '',
    Title: isMulti ? ('订单 ' + shortId(orderId)) : ((paxList[0] && paxList[0].Name) || contact || '乘客'),
    Contact: contact,
    Phone: phone,
    SiteName: pick(raw, ['SiteId_Name', 'SiteName', 'LocationName']) || '',
    PaxList: paxList,
    Expanded: false
  };
}

/* ===================== 站点/班次归一 ===================== */
/*
  GetBusLineShiftOrderInfo 返回结构：
  data = {
    SiteCount, CurrentSite, NextSite_Id, CurrentSite_Id, CurrentSite_Name,
    ShiftData: { LineId_Name, VehicleId_Name, StatingLocation_Name, EndLocation_Name,
                 DepartureTime, SeatTotal, SeatSold, EmptySeat, PersonNum, IsStart_Name },
    SitePeooleNum: [{ Id, LocationName, IsStart, ArrivalTime, StayMinute, ReservationNum, PersonNum }],
    CurrentSiteOrderlist: [ 订单 ]
  }
*/
function parseShift(data) {
  var raw = data || {};
  var shift = pickObj(raw, ['ShiftData', 'shiftData', 'Shift', 'shift']);

  // 站点列表（接口字段名带拼写错误 SitePeooleNum，两个都兼容）
  var siteRaw = pickArr(raw, ['SitePeooleNum', 'SitePeopleNum', 'SitePeooleNumList', 'SiteList', 'Sites', 'List', 'list']);
  var curId = String(pick(raw, ['CurrentSite_Id', 'CurrentSiteId', 'SiteId', 'SiteID']) || '');
  var curName = pick(raw, ['CurrentSite_Name', 'CurrentSiteName', 'SiteId_Name', 'SiteName']) || '';
  var nextId = String(pick(raw, ['NextSite_Id', 'NextSiteId', 'NextSiteID']) || '');
  var curIdx = -1, nextIdx = -1;

  var sites = (siteRaw || []).map(function (s, i) {
    s = s || {};
    var id = String(pick(s, ['Id', 'SiteId', 'SiteID', 'id']) || '');
    var name = pick(s, ['LocationName', 'SiteId_Name', 'SiteName', 'Name']) || '';
    // ReservationNum = 预约人数；PersonNum = 上车人数
    var reservationNum = toNum(pick(s, ['ReservationNum', 'BookNum', 'ReserveNum']), 0);
    var personNum = toNum(pick(s, ['PersonNum', 'BoardNum', 'BoardedNum', 'GetOnNum']), 0);
    if (curId && id === curId) curIdx = i;
    if (nextId && id === nextId) nextIdx = i;
    return {
      Key: 'st' + i,
      SiteId: id,
      SiteName: name,
      Time: fmtTime(pick(s, ['ArrivalTime', 'Time', 'DepartureTime', 'PlanTime'])),
      ReservationNum: reservationNum,   // 预约人数
      PersonNum: personNum,             // 上车人数
      IsStart: toBool(pick(s, ['IsStart', 'IsStartSite'])),
      State: 'todo',
      Meta: '预约 ' + reservationNum + ' 人 · 上车 ' + personNum + ' 人'
    };
  });

  // 顶层只给了站名没给 Id 的情况：按名字再匹配一次
  if (curIdx < 0 && curName) {
    for (var n = 0; n < sites.length; n++) {
      if (sites[n].SiteName === curName) { curIdx = n; break; }
    }
  }

  sites.forEach(function (s, i) {
    if (curIdx >= 0) s.State = i < curIdx ? 'done' : (i === curIdx ? 'current' : 'todo');
  });

  // 当前站：优先列表内匹配，其次用顶层 CurrentSite_Id / CurrentSite_Name 兜底
  var curSite = null;
  if (curIdx >= 0) {
    curSite = sites[curIdx];
  } else if (curId || curName) {
    curSite = {
      Key: 'st-cur', SiteId: curId, SiteName: curName, Time: '',
      ReservationNum: 0, PersonNum: 0, IsStart: false, State: 'current', Meta: ''
    };
  } else if (sites.length) {
    curSite = sites[0];
    curSite.State = 'current';
  }

  // 下一站：NextSite_Id 命中优先，否则取列表里当前站的后一个
  var nextSite = null;
  if (nextIdx >= 0) {
    nextSite = sites[nextIdx];
  } else if (curIdx >= 0 && sites[curIdx + 1]) {
    nextSite = sites[curIdx + 1];
  } else if (nextId) {
    nextSite = { Key: 'st-next', SiteId: nextId, SiteName: '', Time: '', ReservationNum: 0, PersonNum: 0, IsStart: false, State: 'todo', Meta: '' };
  }

  return { shift: shift, sites: sites, curSite: curSite, nextSite: nextSite };
}

// 班次概览
function parseShiftInfo(data, sites, curSite, nextSite) {
  var d = (data && pickObj(data, ['ShiftData', 'shiftData'])) || {};
  var lineName = pick(d, ['LineId_Name', 'LineName']) || '';
  var parts = lineName.split('-');
  var from = pick(d, ['StatingLocation_Name', 'StartSiteName']) || parts[0] || '';
  var to = pick(d, ['EndLocation_Name', 'EndSiteName']) || parts[1] || '';
  var idx = curSite ? sites.indexOf(curSite) : -1;
  var depart = pick(d, ['DepartureTime', 'Time']) || '';

  return {
    statusName: pick(d, ['IsStart_Name']) || '已发车',
    from: from,
    to: to,
    departFull: depart ? (depart + ' 发车') : '',
    plate: pick(d, ['VehicleId_Name', 'VehicleName']) || '',
    seatsTotal: toNum(pick(d, ['SeatTotal', 'SeatsTotal']), 0),
    stopIdx: idx >= 0 ? idx + 1 : 1,
    stopTotal: sites.length || toNum((data || {}).SiteCount, 0),
    currentStop: curSite ? curSite.SiteName : '',
    thisDepart: curSite ? curSite.Time : (fmtTime(depart) || ''),
    nextStop: nextSite ? nextSite.SiteName : '',
    etaNum: nextSite ? nextSite.Time : '',
    etaText: nextSite && nextSite.Time ? ('预计 ' + nextSite.Time + ' 到') : '',
    boarded: toNum(pick(d, ['PersonNum']), 0),
    booked: toNum(pick(d, ['SeatSold']), 0),
    empty: toNum(pick(d, ['EmptySeat']), 0),
    pendingCount: 0
  };
}

/* ===================== 网络请求 ===================== */
function post(url, params) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: baseUrl + url,
      data: params || {},
      method: "POST",
      success: function (res) {
        var r = (res && res.data) || {};
        if (r.code === 0 || r.code === '0') {
          resolve(r.data);
        } else {
          reject(r.msg || r.message || '请求失败');
        }
      },
      fail: function (err) {
        reject((err && err.errMsg) || '网络异常');
      }
    });
  });
}

Page({
  data: {
    ScheduleId: '',
    SiteId: '',        // 当前查看的站点
    siteName: '',
    curSiteId: '',     // 接口返回的「当前站」Id（默认列表来源）
    nextSite: null,    // 下一站
    info: null,
    sites: [],         // 站点列表（含人数）
    orders: [],        // 当前站点订单
    orderShow: [],     // 筛选后展示的订单
    orderTabs: ORDER_TABS,
    orderTab: STATUS_WAIT,
    pendingCount: 0,   // 当前站未上车人数
    loading: false,

    // 确认上车弹框
    showConfirmModal: false,
    confirmOrder: null,
    confirmMode: 'all',
    confirmNum: '',

    // 确认到站弹框
    showArriveModal: false,
    arriveTime: ''
  },

  onLoad(options) {
    options = options || {};
    var id = options.ScheduleId || options.scheduleId || options.Id || options.id || '';
    this.setData({ ScheduleId: id });
    this.loadShiftSites();
  },

  /* ===== 班线默认站点人数：进入页面默认显示当前站订单 ===== */
  loadShiftSites() {
    var _this = this;
    if (!this.data.ScheduleId) {
      wx.showToast({ title: '缺少班次ID', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    post('/api/BusMobile/GetBusLineShiftOrderInfo', {
      ScheduleId: numOrRaw(this.data.ScheduleId)
    }).then(function (data) {
      console.log('[GetBusLineShiftOrderInfo]', data);
      var res = parseShift(data);
      var info = parseShiftInfo(data, res.sites, res.curSite, res.nextSite);
      var patch = {
        sites: res.sites,
        nextSite: res.nextSite,
        curSiteId: res.curSite ? res.curSite.SiteId : '',
        info: info,
        loading: false
      };
      var defOrders = pickArr(data || {}, ['CurrentSiteOrderlist', 'CurrentSiteOrderList']);
      _this.setData(patch, function () {
        // 首次进入默认选中当前站，之后保持已选站点
        if (res.curSite && !_this.data.SiteId) {
          _this.setData({ SiteId: res.curSite.SiteId, siteName: res.curSite.SiteName });
        }
        // 看的是当前站 → 直接用本接口带回的 CurrentSiteOrderlist（默认进页面走这里）
        // 看的是其它站 → 用 GetSiteOrderList 取该站订单
        if (!patch.curSiteId || String(_this.data.SiteId) === String(patch.curSiteId)) {
          _this.applyOrders(defOrders);
        } else {
          _this.loadOrders();
        }
      });
    }).catch(function (msg) {
      _this.setData({ loading: false });
      wx.showToast({ title: msg || '加载失败', icon: 'none' });
    });
  },

  /* ===== 刷新订单：当前站走 GetBusLineShiftOrderInfo，其它站走 GetSiteOrderList ===== */
  reloadOrders() {
    var cur = this.data.curSiteId;
    if (cur && String(this.data.SiteId) === String(cur)) {
      this.loadShiftSites();
    } else {
      this.loadOrders();
    }
  },

  /* ===== 班线·站点 订单列表（点击站点时） ===== */
  loadOrders() {
    var _this = this;
    if (!this.data.ScheduleId) return;
    if (!this.data.SiteId) {
      this.setData({ orders: [], orderShow: [], pendingCount: 0 });
      console.warn('[GetSiteOrderList] SiteId 为空');
      return;
    }
    this.setData({ loading: true });
    post('/api/BusMobile/GetSiteOrderList', {
      ScheduleId: numOrRaw(this.data.ScheduleId),
      SiteId: numOrRaw(this.data.SiteId)
    }).then(function (data) {
      console.log('[GetSiteOrderList]', data);
      var list = Array.isArray(data) ? data : pickArr(data, ['OrderList', 'Orders', 'CurrentSiteOrderlist', 'CurrentSiteOrderList', 'List', 'list', 'Data', 'data']);
      _this.applyOrders(list);
    }).catch(function (msg) {
      _this.setData({ loading: false, orders: [], orderShow: [], pendingCount: 0 });
      wx.showToast({ title: msg || '加载失败', icon: 'none' });
    });
  },

  // 订单归一并写入页面数据
  applyOrders(list) {
    var _this = this;
    var orders = (list || []).map(normOrder);
    var boarded = 0, booked = 0, pending = 0;
    orders.forEach(function (o) {
      booked += o.PersonNum;
      boarded += o.BoardNum;
      if (o.Status !== STATUS_BOARDED) {
        var left = o.PersonNum - o.BoardNum;
        pending += (left > 0 ? left : 0);
      }
    });
    // info 的 已上车/预约/空位 保持班次维度（由 ShiftData 提供），这里只更新本站未上车人数
    var patch = {
      orders: orders,
      loading: false,
      'info.pendingCount': pending
    };
    this.setData(patch, function () {
      _this.filterOrders();
    });
  },

  /* ===== 点击站点：显示该站订单 ===== */
  onSiteTap(e) {
    var _this = this;
    var site = this.data.sites[Number(e.currentTarget.dataset.index)];
    if (!site) return;
    // 只切换查看的站点，info.currentStop 始终表示班车实际所在站
    this.setData({
      SiteId: site.SiteId,
      siteName: site.SiteName
    }, function () {
      _this.loadOrders();
    });
  },

  /* ===== 筛选：未上车 / 已上车 ===== */
  onOrderTabTap(e) {
    this.setData({ orderTab: e.currentTarget.dataset.key });
    this.filterOrders();
  },

  filterOrders() {
    var key = this.data.orderTab;
    var all = this.data.orders || [];
    var wait = [], boarded = [];
    console.log(all)
    for (var i = 0; i < all.length; i++) {
      if (all[i].Status === STATUS_BOARDED) boarded.push(all[i]);
      else wait.push(all[i]);
    }
    var pending = 0;
    for (var j = 0; j < wait.length; j++) {
      var left = wait[j].PersonNum - wait[j].BoardNum;
      pending += (left > 0 ? left : 0);
    }
    var show = key === STATUS_BOARDED ? boarded : wait;
    this.setData({
      orderShow: show,
      pendingCount: pending,
      'info.pendingCount': pending,
      orderTabs: [
        { key: STATUS_WAIT, name: '未上车', count: wait.length },
        { key: STATUS_BOARDED, name: '已上车', count: boarded.length }
      ]
    });
  },

  /* ===== 打电话 ===== */
  onOrderCall(e) {
    var phone = e.currentTarget.dataset.phone;
    if (!phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: String(phone) });
  },

  /* ===== 打开「确认上车」弹框 ===== */
  onConfirmBoard(e) {
    var o = this.data.orderShow[Number(e.currentTarget.dataset.index)];
    if (!o) return;
    this.setData({
      showConfirmModal: true,
      confirmOrder: o,
      confirmMode: 'all',
      confirmNum: String(o.PersonNum || 1)
    });
  },

  closeConfirmModal() {
    this.setData({ showConfirmModal: false, confirmOrder: null });
  },

  onConfirmModeTap(e) {
    this.setData({ confirmMode: e.currentTarget.dataset.mode });
  },

  onConfirmNumInput(e) {
    this.setData({ confirmNum: e.detail.value });
  },

  /* ===== 核验订单：全部上车 / 部分上车 ===== */
  submitConfirm: throttle(function () {
    var _this = this;
    var o = this.data.confirmOrder;
    if (!o) return;
    var total = toNum(o.PersonNum, 0);
    var isAll = this.data.confirmMode === 'all';
    var num = total;
    if (!isAll) {
      num = toNum(this.data.confirmNum, 0);
      if (num <= 0) {
        wx.showToast({ title: '请输入上车人数', icon: 'none' });
        return;
      }
      if (total && num > total) {
        wx.showToast({ title: '上车人数不能大于预约人数', icon: 'none' });
        return;
      }
      isAll = (num === total);
    }
    var request = {
      OrderId: o.OrderId,
      IsAll: isAll,
      PersonNum: num
    };
    wx.showLoading({ title: '提交中' });
    post('/api/BusMobile/UpdateIsAllAndPersonNum', request).then(function () {
      wx.hideLoading();
      wx.showToast({ title: '操作成功', icon: 'none' });
      _this.setData({ showConfirmModal: false, confirmOrder: null });
      _this.reloadOrders();
    }).catch(function (msg) {
      wx.hideLoading();
      wx.showToast({ title: msg || '操作失败', icon: 'none' });
    });
  }, 1500),

  /* ===== 标记未上车 ===== */
  onOrderAbsent: throttle(function (e) {
    var _this = this;
    var o = this.data.orderShow[Number(e.currentTarget.dataset.index)];
    if (!o) return;
    wx.showModal({
      title: '提示',
      content: '确认标记该订单为未上车？',
      success: function (res) {
        if (!res.confirm) return;
        wx.showLoading({ title: '提交中' });
        post('/api/BusMobile/UpdateIsAllAndPersonNum', {
          OrderId: o.OrderId,
          IsAll: false,
          PersonNum: 0
        }).then(function () {
          wx.hideLoading();
          wx.showToast({ title: '已标记未上车', icon: 'none' });
          _this.reloadOrders();
        }).catch(function (msg) {
          wx.hideLoading();
          wx.showToast({ title: msg || '操作失败', icon: 'none' });
        });
      }
    });
  }, 1500),

  /* ===== 多人订单：展开/收起乘客明细 ===== */
  togglePax(e) {
    var i = Number(e.currentTarget.dataset.index);
    var o = this.data.orderShow[i];
    if (!o || !o.IsMulti) return;
    var val = !o.Expanded;
    var patch = {};
    patch['orderShow[' + i + '].Expanded'] = val;
    for (var j = 0; j < this.data.orders.length; j++) {
      if (this.data.orders[j].OrderId === o.OrderId) {
        patch['orders[' + j + '].Expanded'] = val;
        break;
      }
    }
    this.setData(patch);
  },

  // 打开确认到站弹框，默认填入当前时间（时:分）
  confirmArrive() {
    var next = this.data.nextSite;
    if (!next) {
      wx.showToast({ title: '已到终点站', icon: 'none' });
      return;
    }
    var now = new Date();
    this.setData({
      showArriveModal: true,
      arriveTime: pad2(now.getHours()) + ':' + pad2(now.getMinutes())
    });
  },

  closeArriveModal() {
    this.setData({ showArriveModal: false });
  },

  // picker mode=time 回调，只有 时 分
  onArriveTimeChange(e) {
    this.setData({ arriveTime: e.detail.value });
  },

  /* ===== 修改班次到达站点 ===== */
  submitArrive: throttle(function () {
    var _this = this;
    var next = this.data.nextSite;
    if (!next) return;
    var request = {
      ScheduleId: numOrRaw(_this.data.ScheduleId),
      SiteId: numOrRaw(next.SiteId)
    };
    wx.showLoading({ title: '提交中' });
    post('/api/BusMobile/UpdateShiftSite', request).then(function () {
      wx.hideLoading();
      wx.showToast({ title: '已到达 ' + next.SiteName, icon: 'none' });
      // 清空已选站点：刷新后自动选中新的当前站，订单列表同步切换
      _this.setData({ showArriveModal: false, SiteId: '', siteName: '' });
      _this.loadShiftSites();
    }).catch(function (msg) {
      wx.hideLoading();
      wx.showToast({ title: msg || '操作失败', icon: 'none' });
    });
  }, 1500),

  noop() {}
})
