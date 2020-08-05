// ==UserScript==
// @name        问卷星答题助手
// @namespace   wjx
// @match       *://ks.wjx.top/*
// @match       *://sztaxnfbw.wjx.cn/user/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @version     1.2.2
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource 	  ANSWER  https://raw.githubusercontent.com/LawlietKira/auto_answer/master/json/wjx/wjx.v1.1.9.json
// @author      月丶基拉
// @description 自动/手动答题
// ==/UserScript==

(function() {
  // 自动答题类型，0：手动答题；1：自动答题
	let AUTO = GM_getValue('AUTO', '0');
	let origin_answer = JSON.parse(GM_getResourceText('ANSWER', '[]'));
	let target = GM_getValue('ANSWER', []);
  let reloadTime = 3; // 每隔n分钟，刷新选题页面
  let type_rate = {
    radio: '单选',
    checkbox: '复选',
    judge: '判断'
  };
  let radio_rate = GM_getValue('RADIO_RATE', 100), // 单选成功率
      checkbox_rate = GM_getValue('CHECKBOX_RATE', 100), // 复选成功率
      judge_rate = GM_getValue('JUDGE_RATE', 100); // 判断成功率
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

  // 更新答题正确率
  let updateRate = function () {
    radio_rate = GM_getValue('RADIO_RATE', 100); // 单选成功率
    checkbox_rate = GM_getValue('CHECKBOX_RATE', 100); // 复选成功率
    judge_rate = GM_getValue('JUDGE_RATE', 100); // 判断成功率
    
    $('#my_radio').val(radio_rate);
    $('#my_checkbox').val(checkbox_rate);
    $('#my_judge').val(judge_rate);
  }
  
  let getTargetScore = function() {
    return +GM_getValue('TARGET_SCORE', '');
  }
  
  // 判断当前分是否大于目标分
  let isTarScoreLessCurScore = function () {
    let cur_score = +$('#ctl00_ContentPlaceHolder1_userInfoPC_spanPoint').text(),
        target_score = getTargetScore();
    return target_score !== 0 && cur_score > target_score;
  }
	
  // 创建菜单
	let createMenu = function() {
		let $menu = $(`
      <div id="asd" style="z-index: 999;text-align: center; top: 20%;left: 48%;position: fixed;width: 160px;background-color: rgba(127, 255, 216, 0.5);"> 
        <table style="color: black; margin: 5px auto;"> 
          <tbody>
            <tr>
              <td>答题类型</td>
              <td>
                <select id="my_auto" style="height: 25px; margin: auto 5px;border: solid 1px #D9D9D9;"> 
                  <option value="0">手动答题</option> 
                  <option value="1"  ${AUTO === '1' ? 'selected': ''}>自动答题</option> 
                </select>
              </td>
            </tr> 
            <tr>
              <td>目标分数</td>
              <td><input id="my_score" placeholder="空表示无限制" value="${getTargetScore()}" style="width: 78px;margin-top: 5px;height: 25px;" /></td>
            </tr> 
            <tr> 
              <td>判断成功率</td> 
              <td><input id="my_judge" placeholder="100" value="${judge_rate}" style="width: 78px;margin-top: 5px;height: 25px;" /></td> 
            </tr> 
            <tr> 
              <td>单选成功率</td> 
              <td><input id="my_radio" placeholder="100" value="${radio_rate}" style="width: 78px;margin-top: 5px;height: 25px;" /></td> 
            </tr> 
            <tr> 
              <td>复选成功率</td> 
              <td><input id="my_checkbox" placeholder="100" value="${checkbox_rate}" style="width: 78px;margin-top: 5px;height: 25px;" /></td> 
            </tr>
            <tr>
              <td colspan="2"><div id="my_tip" style="color:red; display: ${isTarScoreLessCurScore() ? 'block': 'none'};">当前分大于目标分，自动停止</div></td>
            </tr>
          </tbody>
        </table> 
      </div>`);
		$('body').append($menu);
		$('#my_auto').off('change').on('change', function() {
			if($(this).val() === '1') {
				autoStart();
			}
			GM_setValue('AUTO', $(this).val())
		});
    $('#my_score').off('input').on('input', function() {
      GM_setValue('TARGET_SCORE', $(this).val());
      if (isTarScoreLessCurScore()) {
        $('#my_tip').show();
      } else {
        $('#my_tip').hide();
      }
    });
    
    $('#my_judge').val(judge_rate);
    $('#my_radio').val(radio_rate);
    $('#my_checkbox').val(checkbox_rate);
    // 判断成功率
    $('#my_judge').off('input').on('input', function() {
      let val = $(this).val();
      if (val >= 100) {
        val = 100;
        $(this).val(100);
      }
      GM_setValue('JUDGE_RATE', val);
    });
    // 单选成功率
    $('#my_radio').off('input').on('input', function() {
      let val = $(this).val();
      if (val >= 100) {
        val = 100;
        $(this).val(100);
      }
      GM_setValue('RADIO_RATE', val);
    });
    // 复选成功率
    $('#my_checkbox').off('input').on('input', function() {
      let val = $(this).val();
      if (val >= 100) {
        val = 100;
        $(this).val(100);
      }
      GM_setValue('CHECKBOX_RATE', val);
    });
	}

  // 根据答案，解析为答题选项
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

  // 随机（i * 1000, j * 1000）
	let random = function(i, j) {
		let r = Math.random();
		return Math.floor((i + r * (j - i)) * 1000);
	}
  
  /**
   * answers: 已知答案
   * rate：正确率（0-100）
   * 根据已知答案，判断是否答题
   */
  let isAnswer = function (answers) {
    let type;
    // 没有答案，随机答题
    if (answers.length === 0) {
      console.warn('没有答案，随机答题!');
      return false;
    } else if (answers.length >= 2) {
      // 多选题
      type = 'checkbox';
    } else {
      if (/[A-Z]/.test(answers[0])) {
        // 单选
        type = 'radio';
      } else {
        // 判断
        type = 'jduge';
      }
    }
    
    let r = Math.floor(Math.random() * 100);
    let flag = false;
    if (type === 'radio') {
      flag = r < radio_rate;
    } else if (type === 'jduge') {
      flag = r < judge_rate;
    } else if (type === 'checkbox') {
      flag = r < checkbox_rate;
    } else {
      flag = false;
    }
    console.warn(type_rate[type], r, `选${flag ? '正确' : '错误'}答案！`)
    return flag;
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

  // 自动答题
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
      // 是否正确答题
      let flag = isAnswer(answer);
      if (!flag) {
        $this.attr('style', ($this.attr('style') || '') + ';background-color:antiquewhite;');
      }
			let $ansers = $this.find('.ulradiocheck');
			$ansers.find('li').each((j, it) => {
        let $it = $(it);
        if (flag) {
          let ans_txt = $it.find('label').text();
          if(answer.indexOf(ans_txt.substr(0, 1)) > -1) {
            $it.click();
            console.log(ans_txt)
          }
        } else {
					if(j <= 1 || Math.random() < 0.5) {
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

  // 自动选题页面
	let autoSelectTopic = function() {
		autoTopic = setInterval(function() {
      let cur_score = +jQuery('#ctl00_ContentPlaceHolder1_userInfoPC_spanPoint').text();
      let target_score = getTargetScore();
      
      // 更新答题正确率
      updateRate();
      
      // 如果关闭自动答题，取消定时器
			if((GM_getValue('AUTO',  '0')) === '0') {
				$('#my_auto').val('0');
				clearInterval(autoTopic);
				return;
			}
      // 如果目标分数小于当前分数，停止
      if (isTarScoreLessCurScore()) {
        $('#my_score').val(target_score);
        $('my_tip').show();
				return;
      }
			if(!document.hidden) {
				$('.again-box:eq(0)')[0].click();
			}
		}, 3000);
		setTimeout(function() {
			window.location.reload();
		}, reloadTime * 60 * 1000)
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
		let strAudio = "<audio id='audioPlay' src='http://downsc.chinaz.net/Files/DownLoad/sound1/202001/12404.mp3' hidden='true'>";
		if($('body').find('#audioPlay').length <= 0) {
			$('body').append(strAudio);
		}
    
		unsafeWindow.alert = function(str) {
			let audio = document.getElementById('audioPlay');
			//浏览器支持
			audio.play();
			setTimeout(function() {
				alertFun(str)
			}, 800)
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
