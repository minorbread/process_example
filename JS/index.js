jQuery(document).ready(function($) {
	var runningProcess = null;
	var inputQueue = [];
	var readyQueue = [];
	var finishQueue = [];
	var printNum = 1;
	var processMsg = '';

	// 进程的数据结构
	function Process(id, arriveTime, serviceTime, priority, state, startTime, endTime, cpuTime) {
		this.id = id;							/*进程号*/
		this.priority = priority;				/*进程优先级,值大的优先级高*/
		this.arriveTime = arriveTime;			/*进程到达时间*/
		this.serviceTime = serviceTime;			/*进程服务时间*/
		this.startTime = startTime || -1;		/*进程开始时间*/
		this.endTime = endTime || -1;			/*进程结束时间*/
		this.allTime = serviceTime;				/*进程仍需运行时间*/
		this.cpuTime = cpuTime || 0;			/*进程已占用cpu时间 */
		this.state = state || 'Unarrive';		/*进程状态*/
	}

	// 输入进程的创建
	function createInput(num) {
		var tag = $('#tag');
		var mesStart = ''; 
		for (var i = 1; i <= num; i++) {
			mesStart += '<div class="form-group" ><label for="processNum">进程<span>' + i + '</span></label><div class="row"><div class="col-xs-2"><label for="processNum">进程的到达时间</label><input type="number" class="form-control" id="arriveTime' + i + '" placeholder="arriveTime"></div><div class="col-xs-2"><label for="processNum">服务时间</label><input type="number" class="form-control" id="serviceTime' + i + '" placeholder="serviceTime"></div><div class="col-xs-2"><label for="processNum">优先级</label><input type="number" class="form-control" id="priority' + i + '" placeholder="priority"></div></div></div>';
		}
		mesStart += '<a class="btn btn-default col-xs-offset-5" id="addProcessMes" href="#" role="button">开始</a>'
		tag.html(mesStart);
	}

	// 运行函数
	$('#addProcess').click(function(event) {

		var processNum = $('#processNum').val();
		createInput(processNum);

		$('#addProcessMes').click(function(event) {
			var processNum = $('#processNum').val();
			var proArr = getProcessMes(processNum);
			var process = setProcessMes(processNum, proArr);
			
			// 算法选择标签
			var algo = '<h4>算法选择</h4> <div class="form-group"> <label class="radio-inline"> <input type="radio" name="inlineRadioOptions" id="inlineRadio1" value="option1" checked> 先来先服务调度（FCFS） </label> <label class="radio-inline"> <input type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2"> 时间片轮转调度（Round-Robin） </label> <label class="radio-inline"> <input type="radio" name="inlineRadioOptions" id="inlineRadio3" value="option3"> 动态优先级调度（DynamicPriority） </label> <a class="btn btn-default" id="algo" href="#" role="button">加载</a>'
			// 按照到达时间升序排队
			process.sort(function (begin, end) {
				return begin.arriveTime - end.arriveTime;
			});

			// 赋值给输入队列
			inputQueue = process;

			printAll(-1);
			// UI优化
			var last1 = $('#processMsg1 tr').last();
			last1.hide();

			var proMsg = '';
			var inlineRadioOptions;

			$('#changeAlgo').html(algo);

			$('#algo').click(function(event) {
				inlineRadioOptions = $("input[name='inlineRadioOptions']:checked").val();
				// 算法选择
				switch(inlineRadioOptions) {
					case 'option1':
						FCFS();
						break;
					case 'option2':
						roundRobin();
						break;
					case 'option3':
						dynamicPrio();
						break;
					default:
						FCFS();
						break;
				}
				// UI优化
				var last2 = $('#processMsg' + (printNum - 1) + ' tr').last();
				last2.hide();
			});

		});
	});

	// 获得进程输入信息
	function getProcessMes(processNum) {
		var proArr = [];
		for (var i = 1; i <= processNum; i++) {
			var arriveTime = $('#arriveTime' + i).val();
			var serviceTime = $('#serviceTime' + i).val();
			var priority = $('#priority' + i).val();
			proArr.push([arriveTime, serviceTime, priority]);
		}
		return proArr;
	}

	// 将输入进程信息放入进程对象
	function setProcessMes(processNum, proArr) {
		var process = [];
		for (var j = 0; j < processNum ; j++) {
			process.push(new Process(j + 1, proArr[j][0], proArr[j][1], proArr[j][2]));
		}
		return process;
	}

	// 打印所有进程状态
	function printAll(current) {
		// 进程打印信息
		var processMes = '';

		// 判断初始状态
		if (current !== -1 || current === 0) {
			processMes += '<h4>周转总次数为：' + (printNum - 1) + '</h4>';
		} else {
			processMes += '<h4>初始进程状态</h4>';
		}
		processMes += '<table class="table table-hover"> <thead> <tr> <th>进程号</th> <th>到达时间</th> <th>服务时间</th> <th>优先级</th> <th>状态</th> <th>开始时间</th> <th>结束时间</th> <th>剩余时间</th> <th>周转时间</th> <th>带权周转时间</th> </tr> </thead> <tbody id="processMsg' + printNum + '"> </tbody> </table>';

		// 判断初始状态
		if (current !== -1) {
			$('#processState').html(processMes);
		} else {
			$('#processStat').html(processMes);
		}

		// 打印正在运行的进程
		if (runningProcess != null) {
			processMsg += printProcess(runningProcess);
		}

		// 输出就绪队列中的进程
		for (var l = 0; l < readyQueue.length; l++) {
			processMsg += printProcess(readyQueue[l]);
		}

		// 输出完成队列中的进程
		for (var m = 0; m < finishQueue.length; m++) {
			processMsg += printProcess(finishQueue[m]);
		}

		// 输出输入队列中的进程
		for (var n = 0; n < inputQueue.length; n++) {
			processMsg += printProcess(inputQueue[n]);
		}
		// 打印当前时刻
		processMsg += '<tr><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr><tr><th>当前时刻为:' + printNum + '</th><th>到达时间</th> <th>服务时间</th> <th>优先级</th> <th>状态</th> <th>开始时间</th> <th>结束时间</th> <th>剩余时间</th> <th>周转时间</th> <th>带权周转时间</th></tr>';
		$('#processMsg' + printNum).html(processMsg);
		printNum++;
	}

	function printProcess(proClass) {
		var proMsg = '<tr>';

		if (!proClass) {
			return false;
		}

		if (proClass.state == 'Unarrive') {
			proClass.state = '--';
		}

		proMsg += '<th>' + proClass.id + '</th>' + '<th>' + proClass.arriveTime + '</th>' + '<th>' + proClass.serviceTime + '</th>' + '<th>' + proClass.priority + '</th>' + '<th>' + proClass.state + '</th>'; 

		if (proClass.startTime == -1) {
			proMsg += '<th>--</th> <th>--</th> <th>--</th>';
		} else {
			if (proClass.endTime == -1) {
				proMsg += '<th>' + proClass.startTime + '</th> <th>--</th> <th>' + proClass.allTime  + '</th>';
			} else {
				proMsg += '<th>' + proClass.startTime + '</th> <th>' + proClass.endTime + '</th> <th>' + proClass.allTime  + '</th>';
			}
		}

		if(proClass.state == 'Finish') {
			proMsg += '<th>' + (proClass.endTime - proClass.arriveTime) + '</th> <th>' + ((proClass.endTime - proClass.arriveTime) / proClass.serviceTime).toFixed(2) + '</th></tr>aaa';
		}else{
			proMsg += '<th>--</th> <th>--</th></tr>';
		}
		return proMsg;
	}
	
	function FCFS() {
		// 初始的时间片为1
		var chip = 1;

		// 需要调度标志，默认为true
		var needSchedule = true;

		while(1) {
			
			// 如当前无正在运行进程，同时输入队列和就绪队列都为空，则所有进程完成
			if (!runningProcess && !inputQueue.length && !readyQueue.length) {
				break;
			}

			// 将输入队列中，到达时间小于等于当前时间片的进程放入就绪队列中，并从输入队列中删除
			while(inputQueue.length !== 0) {
				var proClass1 = inputQueue[0];
				if (proClass1.arriveTime <= chip) {
					proClass1 = inputQueue.shift();
					proClass1.state = 'Ready';
					//放入就绪队列队尾
					readyQueue.push(proClass1);
				} else {
					break;
				}
			}

			//判断是否需要调度，如需要则从取出就绪队列队首进程进行调度
			if (needSchedule && readyQueue.length) {

				//取出就绪队首进程 从就绪队列中删除之
				runningProcess = readyQueue.shift();

				//调度进程开始运行,并修改其状态
				runningProcess.startTime = chip;
				runningProcess.state = 'Executing';

				// 调度标志设置为假
				needSchedule = false;
			}
			
			//打印所有进程 
			printAll(chip);

			// 判断是否存在正运行进程,有则增加进程已占用cpu时间,和进程仍需运行时间 
			if (runningProcess) {
				runningProcess.cpuTime += 1;
				runningProcess.allTime -= 1;
				// 若仍需运行时间为0,则修改其状态,放入完成队列,并清空正运行进程,设置调度状态为真
				if (runningProcess.allTime == 0) {
					runningProcess.endTime = chip + 1;
					runningProcess.state = 'Finish';
					finishQueue.push(runningProcess);
					runningProcess = null;
					needSchedule = true;
				} else {
					needSchedule = false;
				}
			}
			chip++;
		}
		//所有任务全部完成后，打印一次
		printAll();
	}

	function roundRobin() {

		// 初始的时间片为1
		var chip = 1;

		// 需要调度标志，默认为true
		var needSchedule = true;

		while(1) {

			// 如当前无正在运行进程，同时输入队列和就绪队列都为空，则所有进程完成
			if (!runningProcess && !inputQueue.length && !readyQueue.length) {
				break;
			}

			//将输入队列中，到达时间小于等于当前时间片的进程放入就绪队列中，并从输入队列中删除
			while(inputQueue.length !== 0) {
				var proClass1 = inputQueue[0];
				if (proClass1.arriveTime <= chip) {
					proClass1 = inputQueue.shift();
					proClass1.state = 'Ready';
					//放入就绪队列队尾
					readyQueue.push(proClass1);
				} else {
					break;
				}
			}

			//判断是否需要调度，如需要则从取出就绪队列队首进程进行调度
			if (needSchedule && readyQueue.length) {
				//取出就绪队首进程 从就绪队列中删除之
				runningProcess = readyQueue.shift();
				
				//调度进程开始运行,对记录第一次运行进程开始时间
				if (runningProcess.startTime == -1) {
					runningProcess.startTime = chip;
				}
				
				// 状态设置为正运行,调度标志改为假				
				runningProcess.state = 'Executing';
				needSchedule = false;
			}

			//打印当前时刻，所有进程的信息
			printAll(chip);

			//当前运行任务完成1个时间片，判断该任务是否已经完成
			if(runningProcess){
				runningProcess.cpuTime += 1;
				runningProcess.allTime -= 1;
				//任务运行结束
				if(runningProcess.allTime == 0){
					runningProcess.endTime = chip + 1;
					runningProcess.state = 'Finish';
					//将其放入完成队列中
					finishQueue.push(runningProcess);
					runningProcess = null;
					needSchedule = true;
				}else{
					//任务没有完成，如果就绪队列中仍有任务，则轮转调度，否则不调度
					if(readyQueue.length){
						runningProcess.state = 'Ready';
						//将其放回就绪队列中
						readyQueue.push(runningProcess);
						runningProcess = null;
						needSchedule = true;
					}else{
						needSchedule = false;
					}
			  }
	  	}
  		chip++;
		}
		//所有任务全部完成后，打印一次
		printAll();
	}

	function dynamicPrio() {

		// 初始的时间片为1
		var chip = 1;

		// 需要调度标志，默认为true
		var needSchedule = true;

		while(1) {

			//如当前无正在运行进程，同时输入队列和就绪队列都为空，则所有进程完成
			if (!runningProcess && !inputQueue.length && !readyQueue.length) {
				break;
			}

			//将输入队列中，到达时间小于等于当前时间片的进程放入就绪队列中，并从输入队列中删除
			while(inputQueue.length !== 0) {
				var proClass1 = inputQueue[0];
				if (proClass1.arriveTime <= chip) {
					proClass1 = inputQueue.shift();
					proClass1.state = 'Ready';
					//放入就绪队列队尾
					readyQueue.push(proClass1);
				} else {
					break;
				}
			}

			// 对就像队列优先级进行排序 
			if(readyQueue.length) {
				readyQueue = readyQueue.sort(function (begin, end) {
					return end.priority - begin.priority;
				});
			}

			//判断是否需要调度，如需要则从取出就绪队列队首进程进行调度
			if (needSchedule && readyQueue.length) {
				//取出就绪队首进程 从就绪队列中删除之
				runningProcess = readyQueue.shift();
				
				//调度进程开始运行
				if (runningProcess.startTime == -1) {
					runningProcess.startTime = chip;
				}
				// 状态设置为正运行,调度标志改为假				
				runningProcess.state = 'Executing';
				needSchedule = false;
			}

			//打印当前时刻，所有进程的信息
			printAll(chip);

			// 判断是否有运行进程
			if(runningProcess){
				runningProcess.cpuTime += 1;
				runningProcess.allTime -= 1;
				//任务运行结束
				if(runningProcess.allTime == 0){
					runningProcess.endTime = chip + 1;
					runningProcess.state = 'Finish';
					//将其放入完成队列中
					finishQueue.push(runningProcess);
					runningProcess = null;
					needSchedule = true;
				} else {
				//任务没有完成，如果就绪队列中仍有任务，且优先级大于本任务的优先级，则轮转调度，否则不调度
					if(runningProcess.priority > 1){
						// 优先级最小为1,运行程序降低优先级
						runningProcess.priority -= 1;
					}
					// 判断就绪队列是否有进程,并且其优先级大于正在运行程序
					if(readyQueue.length && readyQueue[0].priority > runningProcess.priority){
						runningProcess.state = 'Ready';
						readyQueue.push(runningProcess);
						//将其放回就绪队列中
						runningProcess = null;
						needSchedule = true;
					} else {
						needSchedule = false;
					}
				}
			}
			// 时间片自增
			chip++;
		}

		//所有任务全部完成后，打印一次
		printAll();
	}

	$('#processNum').focus(function(event) {
		$('#tag').html('');
		$('#processStat').html('');
		$('#changeAlgo').html('');
		$('#processState').html('');
	});

});