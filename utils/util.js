const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 当天日期，格式 YYYY-MM-DD（如 2026-10-30），供接口的 Today 入参使用
const getToday = () => {
  const date = new Date()
  return [date.getFullYear(), formatNumber(date.getMonth() + 1), formatNumber(date.getDate())].join('-')
}

module.exports = {
  formatTime: formatTime,
  getToday: getToday
}
