// 相关城市编码到12306官网查看：https://www.12306.cn/index/


module.exports = {
  date: "2025-09-30", // 监听日期
  start_station: { // 出发地信息
    name: '广州南',
    code: 'IZQ'
  },
  end_station: { // 到达地信息
    name: '南江口',
    code: 'NDQ'
  },
  isOnlyMonitorUnSale: false // 是否仅监听未发售的班次，即忽略当前有车票的班次
}