// ==UserScript==
// @name        WJX
// @namespace   Violentmonkey Scripts
// @match       *://ks.wjx.top/*
// @match       *://sztaxnfbw.wjx.cn/user/joinrelquery.aspx*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @version     1.0
// @require     https://code.jquery.com/jquery-3.5.1.min.js
// @resource 	  ANSWER  https://raw.githubusercontent.com/LawlietKira/auto_answer/master/json/wjx/wjx.json
// @author      -
// @description 2020/7/28 下午9:43:13
// ==/UserScript==
(function() {
  let origin_answer = JSON.parse(GM_getResourceText('ANSWER') || '{}');
	let target = GM_getValue('ANSWER') || [];
  
  let merge = function (target, origin) {
    origin.forEach(item => {
      let temp = target.find(i => i.topicId === item.topicId);
      if (temp) {
        temp.answer = item.answer
      } else {
        target.push(item);
      }
    });
    return target;
  }
  
  console.log('target', target.length)
  console.log('origin', origin_answer.length)
  let ANSWER = merge(target, origin_answer);
  console.log('ANSWER', ANSWER.length);
  
	let findAnswer = function(ans) {
		ans = ans.replace(/\┋/g, '|');
		if(ans === '对' || ans === '错') {
			return [ans];
		} else {
			let a = ans.split('|');
			return a.map(item => {
				return item.substr(0, 1);
			});
		}
	}

	let findTopic = function(text) {
		text = text.replace(/^[\d]+\./, '');
		text = text.replace(/\[分值：[\d]+\]$/, '');
		return text.trim();
	}

	let findFromAnswer = function(topic) {
		// console.log('topic', topic)
		let ans = ANSWER.find(item => {
			return item.topic.trim() === topic.trim()
		});
		return ans;
	}

	let random = function(i, j) {
		let r = Math.random();
		return Math.floor((i + r * (j - i)) * 1000);
	}

	let saveAnserByPage = function() {
		$('.query__data-result .data__items').each((i, item) => {
			let $this = $(item);
			let obj = {
				topicId: $this.attr('topic')
			};

			let $data_tit = $this.find('.data__tit');
			$data_tit.remove('label').remove('span');

			obj.topic = findTopic($data_tit.text());
			let $data_key = $this.find('.data__key');
			let text = $data_key.text(),
				res = '';
			if(text.indexOf('正确答案为：') > -1) {
				res = text.split('正确答案为：')[1].split('答案解析')[0];
			} else {
				res = text.split('您的回答：')[1].split('答案解析')[0];
			}
			obj.answer = findAnswer(res);
			let theAns = ANSWER.find(a => a.topicId === obj.topicId);
			if(!theAns) {
				ANSWER.push(obj)
				GM_setValue('ANSWER', ANSWER);
				console.log(`添加答案${i+1}`, obj);
			} else {
				theAns.answer = obj.answer;
				GM_setValue('ANSWER', ANSWER);
				console.log(`更新答案${i+1}`, obj);
			}
		});
	}

	let answerTopic = function() {
		$('#fieldset1 .div_question').each((i, item) => {
			let $this = $(item);
			let $topic = $this.find('.div_title_question');
			$topic.find('span').remove();
			let ans = findFromAnswer($topic.text())
			let answer = []
			if(ans) {
				answer = ans.answer;
				console.log(ans)
			} else {
				console.log(`${i + 1}题没有答案`)
			}

			let $ansers = $this.find('.ulradiocheck');
			$ansers.find('li').each((j, it) => {
				let $it = $(it);
				let ans_txt = $it.find('label').text();
				if(answer.indexOf(ans_txt.substr(0, 1)) > -1) {
					$it.click();
					console.log(ans_txt)
				}
				if(answer.length === 0) {
					if(j === 0 || Math.random() < 0.5) {
						$it.click()
						console.log(`随机选择${j + 1}`)
					}
				}
			});
		})
		setTimeout(function() {
			//$('#submit_button').click()
		}, random(3, 6))
	}
	console.log(window.location.href)
	let href = window.location.href;
	if (href.indexOf('https://ks.wjx.top/wjx') > -1) {
		// 答案页面
		setTimeout(saveAnserByPage, 2000)
	} else if (href.indexOf('https://ks.wjx.top/jq') > -1) {
		// 答题页面
		setTimeout(answerTopic, 2000)
	} else {
		console.warn('地址有误！')
	}
})();