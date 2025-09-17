const axios = require("axios");
const schedule = require("node-schedule");
const wxpusher = require("./wxpusher/index");
const baseConfig = require('./config.js')

const zero = (n) => {
  return n > 9 ? n : `0${n}`;
};
const formatDate = (date) => {
  const oDate = new Date(date);
  const year = oDate.getFullYear();
  const month = zero(oDate.getMonth() + 1);
  const dat = zero(oDate.getDate());
  const hour = zero(oDate.getHours());
  const minute = zero(oDate.getMinutes());
  const second = zero(oDate.getSeconds());
  return `${year}-${month}-${dat} ${hour}：${minute}：${second}`;
};

// 自定义范围随机数
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

let errWarning = false;
let timer = null;

let clearIndex = 0;
const clearConsole = () => {
  if (clearIndex >= 100) {
    clearIndex = 0;
    console.clear();
  } else {
    clearIndex++;
  }
};

let initLength = 0;
let pauseList = []; // 第一次运行时, 存储暂停发售的班次

const getCheci = (str) => {
  // 从加密字符串中提取班次
  const match = str.match(/\|D\d{4,5}\|/);
  const result = match ? match[0].replace(/\|/g, "") : null;
  // console.log(result); // 输出: D3757
  return result;
};
const getDataList = () => {
  const config = {
    method: "get",
    url: `https://kyfw.12306.cn/otn/leftTicket/queryG?leftTicketDTO.train_date=${baseConfig.date}&leftTicketDTO.from_station=${baseConfig.start_station.code}&leftTicketDTO.to_station=${baseConfig.end_station.code}&purpose_codes=ADULT`, // 目标URL
    headers: {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "if-modified-since": "0",
    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  };
  // 发送请求
  axios(config)
    .then(function (response) {
      const resData = response.data.data;
      // console.log(resData.result);
      const resultList = resData?.result;
      if (resultList) {
        const canStart = resultList.some((x) => {
          let a = x.includes("有");
          if (pauseList.length > 0) {
            const checi = getCheci(x);
            if (pauseList.includes(checi)) {
              if (!x.includes("暂停发售")) {
                a = true;
              }
            }
          }
          return a;
        });
        if (initLength === 0) {
          initLength = resultList.length;
          resultList.forEach((x) => {
            if (x.includes("暂停发售")) {
              pauseList.push(getCheci(x));
            }
          });
          console.log('-----------------------')
          console.log('-----------------------')
          console.log('-----------------------')
          console.log(`初始化获取班次总数：${initLength}`);
          console.log(`初始化获取待发售班次：${pauseList}`);
          console.log('-----------------------')
          console.log('-----------------------')
          console.log('-----------------------')
        }
        
        console.log(
          `时间：${formatDate(Date.now())} | 当前班次总数：${resultList.length}`
        );
        
        console.log("是否开售：", canStart ? "是" : "否");
        if (initLength > 0 && (canStart || resultList.length > initLength)) {
          wxpusher.sendMessage(`${baseConfig.date}, ${baseConfig.start_station.name} 到 ${baseConfig.end_station.name}新增加班车`);
        }
      }
      clearConsole();
    })
    .catch(function (error) {
      if (!errWarning) {
        // errWarning = true
        // clearInterval(timer)
        // timer = null
        wxpusher.sendMessage("12306接口异常");
      }
      console.log(error); // 打印错误信息
    });
};

const startTask = () => {
  if (timer) {
    return false;
  }
  console.log("开始任务:");
  errWarning = false;
  // 这里放置你的任务逻辑
  const interfaceFreq = randomInt(8, 15)
  timer = setInterval(() => {
    getDataList();
  }, interfaceFreq * 1000);
};
const stopTask = () => {
  console.log("结束任务:");
  clearInterval(timer);
  timer = null;
};

const createTask = (hour, minute, taskFun) => {
  // 设置定时任务规则
  // 例如，每天的15:30执行任务
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, new schedule.Range(1, 6)]; // 周日到周六
  rule.hour = hour; // 下午3点
  rule.minute = minute;
  // 使用schedule库来调度任务
  schedule.scheduleJob(rule, taskFun);
};

createTask("06", "00", startTask); // 每天开始任务时间
createTask("22", "00", stopTask); // 每天结束任务时间
startTask();

// wxpusher.sendMessage("南江口-广州4月6号新增加班车");
