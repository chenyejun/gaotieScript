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
  interfaceFreq: 10000 // 接口调用频率，默认10秒，太频繁可能会触发接口异常
}