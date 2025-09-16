const axios = require("axios");
const schedule = require("node-schedule");
const wxpusher = require("./wxpusher/index");

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
let zantingList = []; // 第一次运行时,存储暂停发售的班次

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
    // url: "https://kyfw.12306.cn/otn/leftTicket/queryG?leftTicketDTO.train_date=2025-02-10&leftTicketDTO.from_station=GZQ&leftTicketDTO.to_station=NDQ&purpose_codes=ADULT",
    url: "https://kyfw.12306.cn/otn/leftTicket/queryG?leftTicketDTO.train_date=2025-09-30&leftTicketDTO.from_station=GZQ&leftTicketDTO.to_station=NDQ&purpose_codes=ADULT", // 目标URL
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
    "x-requested-with": "XMLHttpRequest",
    "cookie": "_uab_collina=175566143496125733153601; JSESSIONID=55FF9F74F87EADB612E6A0C40B5F1EB2; _jc_save_fromStation=%u5E7F%u5DDE%2CGZQ; _jc_save_toStation=%u5357%u6C5F%u53E3%2CNDQ; _jc_save_wfdc_flag=dc; BIGipServerotn=1524171018.50210.0000; BIGipServerpassport=971505930.50215.0000; guidesStatus=off; highContrastMode=defaltMode; cursorStatus=off; route=495c805987d0f5c8c84b14f60212447d; _jc_save_fromDate=2025-09-30; _jc_save_toDate=2025-09-16",
    "Referer": "https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=%E5%B9%BF%E5%B7%9E,GZQ&ts=%E5%8D%97%E6%B1%9F%E5%8F%A3,NDQ&date=2025-09-30&flag=N,N,Y"
  },
  };
  // 发送请求
  axios(config)
    .then(function (response) {
      const resData = response.data.data;
      // console.log(resData.result);
      const resultList = resData.result;
      const canStart = resultList.some((x) => {
        let a = x.includes("有");
        if (zantingList.length > 0) {
          const checi = getCheci(x);
          if (zantingList.includes(checi)) {
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
            zantingList.push(getCheci(x));
          }
        });
        console.log('-----------------------')
        console.log('-----------------------')
        console.log('-----------------------')
        console.log(`初始化获取班次总数：${initLength}`);
        console.log(`初始化待发售班次：${zantingList}`);
        console.log('-----------------------')
        console.log('-----------------------')
        console.log('-----------------------')
      }
      
      console.log(
        `时间：${formatDate(Date.now())} | 当前班次总数：${resultList.length}`
      );

      console.log("是否开售：", canStart ? "是" : "否");
      if (initLength > 0 && (canStart || resultList.length > initLength)) {
        wxpusher.sendMessage("广州-南江口9月30号新增加班车");
      }
      clearConsole();
    })
    .catch(function (error) {
      if (!errWarning) {
        // errWarning = true
        // clearInterval(timer)
        // timer = null
        // wxpusher.sendMessage("12306接口异常");
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
  timer = setInterval(() => {
    getDataList();
  }, 10000);
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

createTask("06", "00", startTask);
createTask("23", "00", stopTask);
startTask();

// wxpusher.sendMessage("南江口-广州4月6号新增加班车");
