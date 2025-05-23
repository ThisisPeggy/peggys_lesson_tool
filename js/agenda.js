// js/agenda.js

// agendaPageHtml: 存储 Agenda 页面主要的 HTML 结构。
// 这部分内容是直接从你提供的 agenda.html 的 <body> 标签内部提取出来的。
// 使用反引号 (`) 定义多行字符串，方便书写 HTML。
const agendaPageHtml = `
    <div class="flex flex-grow p-6"> 
        <div class="w-1/4 pr-6 space-y-4">
            <div>
                <button class="w-full p-4 text-left font-semibold text-gray-800">我的笔记</button>
                <div class="p-4">
                    <ul id="notes-list" class="space-y-2 text-gray-800"></ul>
                </div>
            </div>
            <div>
                <button class="w-full p-4 text-left font-semibold text-gray-800">待办事项</button>
                <div class="p-4">
                    <ul id="todos-list" class="space-y-2 text-gray-800"></ul>
                </div>
            </div>
            <div>
                <button class="w-full p-4 text-left font-semibold text-gray-800">课程提醒</button>
                <div class="p-4">
                    <ul id="courses-list" class="space-y-2 text-gray-800"></ul>
                </div>
            </div>
        </div>

        <div class="w-3/4 bg-white rounded-lg shadow-md p-6 relative">
            <div class="absolute top-4 right-4 flex space-x-2">
                <button id="add-btn" class="leaf-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                            fill="#2ecc71" />
                    </svg>
                </button>
                <button id="calendar-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                            fill="#2ecc71" />
                    </svg>
                </button>
            </div>

            <div id="timeline-view">
                <div id="timeline" class="timeline"></div>
            </div>

            <div id="calendar-view" class="hidden">
                <div id="calendar" class="grid grid-cols-7 gap-2"></div>
            </div>
        </div>
    </div>

    <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-96 modal">
            <h3 class="text-lg font-bold mb-4 text-gray-800">添加新记录</h3>
            <textarea id="note-input" class="w-full p-2 border rounded mb-4 text-gray-800" placeholder="输入内容..."
                rows="4"></textarea>
            <input id="note-tag" class="w-full p-2 border rounded mb-4 text-gray-800" placeholder="输入标签（可选）">
            <div class="flex justify-end space-x-2">
                <button id="cancel-btn" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">取消</button>
                <button id="save-btn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">保存</button>
            </div>
        </div>
    </div>
`;

// initAgendaPage: 负责初始化 Agenda 页面。
// 这个函数会被 main.js 的路由调用，不再依赖 DOMContentLoaded。
export function initAgendaPage() {
    console.log('initAgendaPage 被调用：正在渲染 Agenda 页面...');

    // 获取主内容区域（在 index.html 中定义）
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error('错误：未找到 .main-content 元素，无法渲染 Agenda 页面！');
        return;
    }

    // 将 Agenda 页面的 HTML 模板注入到主内容区域
    mainContent.innerHTML = agendaPageHtml;

    // 获取页面元素 (现在这些元素都在 mainContent 内部了，所以可以直接获取)
    const timelineView = document.getElementById('timeline-view');
    const calendarView = document.getElementById('calendar-view');
    const timeline = document.getElementById('timeline');
    const calendar = document.getElementById('calendar');
    const notesList = document.getElementById('notes-list');
    const todosList = document.getElementById('todos-list');
    const coursesList = document.getElementById('courses-list');
    const addBtn = document.getElementById('add-btn');
    const calendarBtn = document.getElementById('calendar-btn');
    const modal = document.getElementById('modal');
    const noteInput = document.getElementById('note-input');
    const noteTag = document.getElementById('note-tag');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // 从 localStorage 加载笔记数据
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    // 初始化渲染时间线和左侧列表
    renderTimeline();
    renderLists();

    // =============== 事件监听器 ==================

    // 视图切换按钮的点击事件
    calendarBtn.addEventListener('click', () => {
        timelineView.classList.toggle('hidden');
        calendarView.classList.toggle('hidden');
        if (!calendarView.classList.contains('hidden')) {
            renderCalendar(); // 如果切换到日历视图，渲染日历
        }
    });

    // 打开模态框的点击事件
    addBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    // 关闭模态框的点击事件
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        noteInput.value = ''; // 清空输入框
        noteTag.value = '';
    });

    // 保存笔记的点击事件
    saveBtn.addEventListener('click', () => {
        const content = noteInput.value.trim();
        const tag = noteTag.value.trim();
        if (content) {
            // 使用 dayjs 格式化当前时间
            const date = dayjs().format('YYYY-MM-DD HH:mm');
            // 根据内容或标签分类笔记
            const category = tag || categorizeNote(content);
            // 将新笔记添加到数组
            notes.push({ content, date, category });
            // 保存到 localStorage
            localStorage.setItem('notes', JSON.stringify(notes));
            
            // 重新渲染时间线和列表
            renderTimeline();
            renderLists();
            
            // 关闭模态框并清空输入
            modal.classList.add('hidden');
            noteInput.value = '';
            noteTag.value = '';
        }
    });

    // =============== 辅助函数 ==================

    /**
     * 根据笔记内容自动分类。
     * @param {string} content - 笔记内容。
     * @returns {string} 笔记类别（'待办', '课程', '笔记'）。
     */
    function categorizeNote(content) {
        if (content.includes('作业') || content.includes('任务') || content.includes('deadline')) {
            return '待办';
        } else if (content.includes('课程') || content.includes('上课') || content.includes('讲座')) {
            return '课程';
        } else {
            return '笔记';
        }
    }

    /**
     * 渲染时间线视图中的笔记。
     */
    function renderTimeline() {
        timeline.innerHTML = ''; // 清空时间线
        // 按日期降序排序笔记
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        notes.forEach((note, index) => {
            const div = document.createElement('div');
            // 交替放置卡片在时间线的左右
            const isLeft = index % 2 === 0; 
            // 根据类别添加不同的背景色
            div.className = `note-card ${isLeft ? 'left-0' : 'right-0'} ${note.category === '待办' ? 'bg-yellow-100' : note.category === '课程' ? 'bg-blue-100' : 'bg-gray-100'}`;
            // 根据索引设置垂直位置
            div.style.top = `${index * 120}px`; 
            // 填充笔记内容
            div.innerHTML = `
                <span class="text-sm text-gray-800">${note.date}</span>
                <span class="ml-2 text-sm font-bold text-green-500">[${note.category}]</span>
                <p>${note.content}</p>
            `;
            timeline.appendChild(div);

            // 添加树枝节点
            const dot = document.createElement('div');
            dot.className = 'timeline-dot';
            dot.style.top = `${index * 120 + 20}px`; // 与卡片对齐
            timeline.appendChild(dot);
        });
        // 调整时间线的高度以适应所有笔记
        timeline.style.height = `${notes.length * 120 + 100}px`; // 额外增加一些空间
    }

    /**
     * 渲染日历视图。
     */
    function renderCalendar() {
        calendar.innerHTML = ''; // 清空日历
        const today = dayjs();
        const daysInMonth = today.daysInMonth(); // 获取当月天数

        // 填充月份中的每一天
        for (let i = 1; i <= daysInMonth; i++) {
            const date = today.set('date', i).format('YYYY-MM-DD'); // 获取当前日期的字符串
            // 检查是否有笔记在这一天
            const hasNote = notes.some(note => note.date.startsWith(date)); 
            const div = document.createElement('div');
            div.className = `p-2 border rounded text-center cursor-pointer ${hasNote ? 'bg-green-200' : 'bg-white'}`;
            div.textContent = i; // 显示日期数字
            div.dataset.date = date; // 存储完整日期，方便后续查找
            
            // 点击日期跳转回时间线视图并滚动到对应笔记
            div.addEventListener('click', () => {
                timelineView.classList.remove('hidden');
                calendarView.classList.add('hidden');
                renderTimeline(); // 重新渲染时间线以确保内容最新
                // 找到对应日期的笔记卡片并滚动到视图
                // 这里可能需要更精确的选择器，因为 note-card 没有 data-date
                const targetNoteCard = Array.from(timeline.querySelectorAll('.note-card')).find(card => card.innerHTML.includes(date));
                if (targetNoteCard) {
                    targetNoteCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // 如果没有找到具体笔记，就滚动到时间线顶部
                    timeline.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            calendar.appendChild(div);
        }
    }

    /**
     * 渲染左侧的笔记、待办事项和课程提醒列表。
     */
    function renderLists() {
        notesList.innerHTML = '';
        todosList.innerHTML = '';
        coursesList.innerHTML = '';

        notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'text-sm text-gray-800';
            li.textContent = note.content;

            if (note.category === '待办') {
                todosList.appendChild(li.cloneNode(true));
            } else if (note.category === '课程') {
                coursesList.appendChild(li.cloneNode(true));
            }
            // 所有笔记都归类到“我的笔记”下
            notesList.appendChild(li.cloneNode(true));
        });
    }
}