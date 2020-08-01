// ==UserScript==
// @name        问卷星答题助手
// @namespace   wjx
// @match       *://ks.wjx.top/*
// @match       *://sztaxnfbw.wjx.cn/user/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @version     1.2.0
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource 	ANSWER  https://raw.githubusercontent.com/LawlietKira/auto_answer/master/json/wjx/wjx.v1.1.9.json
// @author      月丶基拉
// @description 自动/手动答题
// ==/UserScript==

(function() {
	let AUTO = GM_getValue('AUTO', '0');
	let origin_answer = JSON.parse(GM_getResourceText('ANSWER', '[]'));
	let target = GM_getValue('ANSWER', []);
	// 自动选题的id
	let autoTopic = 0;

	let merge = function(target, origin) {
		origin.forEach(item => {
			let temp = target.find(i => i.topicId === item.topicId);
			if(temp) {
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

	let findAnswerByTopicId = function(topicId) {
		return ANSWER.find(item => item.topicId == topicId);
	}

	let filterAnswerByTopicId = function(topicId) {
		return ANSWER.filter(item => item.topicId == topicId);
	}

    	let autoFindAnswerByTopicId = function () {
		setInterval(function () {
			if (typeof topicId !== 'undefined') {
				console.log(filterAnswerByTopicId(topicId));
				delete topicId;
			}
			if (typeof topic !== 'undefined') {
				console.log(filterFromAnswer(topic));
				delete topic;
			}
			if (typeof clearAnswer !== 'undefined') {
				GM_setValue('ANSWER', '')
				delete clearAnswer;
			}
		}, 2000);
	}
	
	let createMenu = function() {
		let $menu = $(`
      <div id="asd" style="z-index: 999;text-align: center; top: 20%;left: 48%;position: fixed;width: 136px;height: 100px;background-color: blanchedalmond;">
        <select id="my_auto" style="height: 25px;margin: auto 5px;border: solid 1px #D9D9D9;">
          <option value="0">手动答题</option>
          <option value="1" ${AUTO === '1' ? 'selected': ''}>自动答题</option>
        </select>
      </div>`);
		$('body').append($menu);
		$('#my_auto').off('change').on('change', function() {
			if($(this).val() === '1') {
				autoStart();
			}
			GM_setValue('AUTO', $(this).val())
		})
	}

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
	
	let filterFromAnswer = function(topic) {
		// console.log('topic', topic)
		let ans = ANSWER.filter(item => {
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
			if(GM_getValue('AUTO') === '1') {
				setTimeout(function() {
					window.close();
				}, 500)
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
				$this.attr('style', ($this.attr('style') || '') + ';background-color:antiquewhite;');
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
		window.location.hash = '#submit_button'

		if(GM_getValue('AUTO') === '1') {
			setTimeout(function() {
				$('#submit_button').click()
			}, random(3, 5))
		}
	}

	let autoSelectTopic = function() {
		autoTopic = setInterval(function() {
			if((GM_getValue('AUTO',  '0')) === '0') {
				$('#my_auto').val('0');
				clearInterval(autoTopic);
				return;
			}
			if(!document.hidden) {
				$('.again-box:eq(0)')[0].click();
			}
		}, 3000);
		setTimeout(function() {
			window.location.reload();
		}, 3 * 60 * 1000)
	}

	let autoStart = function() {
		// 如果AUTO == 1，开启自动答题
		let href = window.location.href;
		if(href.indexOf('https://sztaxnfbw.wjx.cn/user/NewQListResult.aspx') > -1) {
			// 选题页面
			autoSelectTopic();
		} else {
			console.warn('地址有误！')
		}
	}

	let monitoringAlert = function() {
		let alertFun = unsafeWindow.alert;
		let strAudio = "<audio id='audioPlay' src='http://www.xmf119.cn/static/admin/sounds/notify.wav' hidden='true'>";
		if($('body').find('#audioPlay').length <= 0) {
			$('body').append(strAudio);
		}
    
		unsafeWindow.alert = function(str) {
			let audio = document.getElementById('audioPlay');
			//浏览器支持
			audio.play();
			setTimeout(function() {
				alertFun(str)
			}, 500)
		}
	}

	let spaceCommit = function() {
		$(document).keypress(function(e) {
			if(e.keyCode == 32) {
				$('#submit_button').click()
			}
		})
	}

	let start = function() {
		// 创建菜单
		createMenu();
		// 绑定空格提交
		spaceCommit();
		
		if(GM_getValue('AUTO', '0') === '1') {
			autoStart();
		} else {
			clearInterval(autoTopic)
		}
		// 不管是否自动答题，都要答题/保存答案
		let href = window.location.href;
		if(href.indexOf('https://ks.wjx.top/jq') > -1) {
			// 答题页面
			setTimeout(answerTopic, 1000)
			// 监控alert事件
			monitoringAlert();
		} else if(href.indexOf('https://ks.wjx.top/wjx') > -1) {
			// 答案页面
			setTimeout(saveAnserByPage, 500)
		} else if(href.indexOf('https://sztaxnfbw.wjx.cn/user/joinrelquery.aspx') > -1) {
			// 答案页面
			setTimeout(saveAnserByPage, 500)
		}
    
		autoFindAnswerByTopicId()
	}

	start()
})();
