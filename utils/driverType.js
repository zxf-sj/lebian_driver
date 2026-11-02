// utils/driverType.js 司机身份与锁套工具
// 班车司机（100004-0001360002）永远只能待在第二套，禁止进入第一套任何页面
const BUS_DRIVE_TYPE = '100004-0001360002';

function isBusDriver() {
  var userInfo = wx.getStorageSync('userInfo');
  return !!(userInfo && userInfo.DriveType == BUS_DRIVE_TYPE);
}

/**
 * 第一套页面守卫：班车司机一旦被以各种方式打开（冷启动、切 tab、回退），
 * 一律 reLaunch 回排班页。
 * @returns {Boolean} true 表示已拦截，调用方应立即 return，不再执行本页逻辑
 */
function blockBusDriver() {
  if (isBusDriver()) {
    wx.reLaunch({ url: '/pages/busIndex/busIndex' });
    return true;
  }
  return false;
}

module.exports = {
  isBusDriver: isBusDriver,
  blockBusDriver: blockBusDriver
};
