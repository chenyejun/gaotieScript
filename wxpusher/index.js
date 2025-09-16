const axios = require("axios");
const userData = require('./user-data.js')

const sendMessage = (content) => {
  // 配置POST请求的数据
  const data = {
    appToken: userData.appToken,
    content,
    contentType: 1,
    uids: userData.uids
  };

  // 发起POST请求
  axios
    .post("https://wxpusher.zjiecode.com/api/send/message", data)
    .then((response) => {
      console.log("Success:", response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

exports.sendMessage = sendMessage;
