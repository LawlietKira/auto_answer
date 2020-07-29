// ==UserScript==
// @name        问卷星-练兵比武
// @namespace   wjx
// @require     https://code.jquery.com/jquery-3.5.1.min.js
// @match       *://sztaxnfbw.wjx.cn/user/NewQListResult.aspx
// @grant       none
// @version     1.0.0
// @author      月丶基拉
// @description 自动点击答题
// ==/UserScript==

(function() {
  setInterval(function() {
    console.log(document.hidden)
    if (!document.hidden) {
      $('.again-box:eq(0)')[0].click();
    }
  }, 4000);
})()