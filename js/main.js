// js/main.js

// 导入需要用到的模块和函数
import { getSavedLessons, saveLessons } from './dataStorage.js';
import { setupLessonForm } from './prepare-lesson.js';
import { initAgendaPage } from './agenda.js';

// 全局变量，用于记录页面开始使用的时间，用于表情列车功能
let startTime;

// =========================================================
// 核心路由功能
// =========================================================

const routes = {
    // 默认路径：当哈希为空时，显示首页（现在包含问候语）
    '': {
        name: '首页',
        render: () => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const hour = new Date().getHours();
                let greetingText = "Hi";
                if (hour < 12) greetingText = "🌞 早上好";
                else if (hour < 18) greetingText = "☀️ 中午好";
                else greetingText = "🌙 晚上好";

                mainContent.innerHTML = `<h1 class="text-4xl font-bold text-gray-800 mb-4">${greetingText} Peggy</h1>`;
            }
            updateCurrentTime();
            console.log('路由到首页');
        }
    },
    '/prepare-lesson': {
        name: '备课',
        render: (params) => {
            const lessonId = params.get('lessonId');
            setupLessonForm(lessonId);
            console.log(`路由到备课页面，课程ID: ${lessonId || '新课程'}`);
        }
    },
    '/agenda': {
        name: 'Agenda',
        render: () => {
            initAgendaPage();
            console.log('路由到 Agenda 页面');
        }
    }
};

function router() {
    const hash = window.location.hash.slice(1) || '';
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);

    const route = routes[path];

    if (route) {
        route.render(params);
        updateNavLinks(path);
    } else {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center text-red-600">
                    <h1 class="text-4xl font-bold mb-4">404 - 页面未找到</h1>
                    <p class="text-xl">您访问的页面不存在。</p>
                    <a href="#/" class="mt-4 px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">返回首页</a>
                </div>
            `;
        }
        console.warn(`路由未找到：${path}`);
    }
}

function updateNavLinks(currentPath) {
    document.querySelectorAll('.navbar-link').forEach(link => {
        const linkPath = link.getAttribute('href').slice(1);
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        const linkPath = link.getAttribute('href') ? link.getAttribute('href').slice(1) : '';
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}


// =========================================================
// 组件加载和通用功能
// =========================================================

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const currentTimeElement = document.getElementById('current-time');
    if (currentTimeElement) {
        currentTimeElement.textContent = timeString;
    }
}

function updateMoodTrain() {
    const moodTrain = document.getElementById('usage-time');
    if (!moodTrain || !startTime) return;

    const now = new Date();
    const minutes = Math.floor((now - startTime) / (1000 * 60));
    const moodCount = Math.floor(minutes / 30);

    moodTrain.innerHTML = '';
    if (minutes >= 180) {
        moodTrain.textContent = '休息一下吧';
        moodTrain.style.width = 'auto';
    } else {
        for (let i = 0; i < Math.min(moodCount, 6); i++) {
            if ((i + 1) % 3 === 0 && i > 0) {
                moodTrain.insertAdjacentHTML('beforeend', '<span>🍂</span><span>🍃</span>');
            } else {
                moodTrain.insertAdjacentHTML('beforeend', '<span>🍃</span>');
            }
        }
        moodTrain.style.width = (moodTrain.children.length * 20) + 'px';
    }
}

function loadNavbar() {
    fetch('components/navbar.html')
        .then(response => response.text())
        .then(html => {
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) {
                navbarContainer.innerHTML = html;
                setupNavLinks();
                updateCurrentTime();
                console.log('导航栏加载并设置成功。');
            }
        })
        .catch(error => console.error('Error loading navbar:', error));
}

function loadSidebar() {
    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(html => {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = html;
                // === 在这里添加这两行 console.log ===
                console.log('侧边栏HTML已注入。');
                console.log('侧边栏内容:', html);
                // ===================================
                setupSidebar();
                renderPreparedLessons(); // 渲染侧边栏中的课程列表
                console.log('侧边栏加载并设置成功。');
            }
        })
        .catch(error => console.error('Error loading sidebar:', error));
}

function setupSidebar() {
    const allMenuToggles = document.querySelectorAll('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (!allMenuToggles.length || !sidebar) {
        console.error('setupSidebar 错误：找不到菜单切换按钮或侧边栏元素！');
        return;
    }

    allMenuToggles.forEach(toggleButton => {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            allMenuToggles.forEach(btn => btn.classList.toggle('active'));
        });
    });

    // **关键修改：监听 .menu-header 的点击事件来切换子菜单**
    document.querySelectorAll('.sidebar-menu .menu-item .menu-header').forEach(header => {
        header.addEventListener('click', () => {
            // 找到 header 内部的 span.menu-title (备课、知识库、工具库标题)
            const titleSpan = header.querySelector('.menu-title');
            if (titleSpan) {
                const targetId = titleSpan.dataset.target; // 获取 data-target 属性
                if (targetId) {
                    const subMenu = document.getElementById(targetId);
                    if (subMenu && subMenu.classList.contains('sub-menu')) {
                        subMenu.classList.toggle('show');
                        // 可以选择切换一个类来改变箭头方向（如果添加了箭头图标）
                        titleSpan.classList.toggle('expanded'); 
                    }
                }
            }
        });
    });

    // **新增：让 "备课" 子菜单默认展开，如果里面有内容的话**
    // 确保在 renderPreparedLessons 之后再执行这个逻辑，或者在 DOM 渲染后延迟执行
    // 可以在 renderPreparedLessons 内部调用，或者在 DOMContentLoaded 中再检查一次
    const preparedLessonsList = document.getElementById('prepared-lessons-list');
    if (preparedLessonsList && getSavedLessons().length > 0) {
        // 找到其父级 .menu-header
        const parentHeader = preparedLessonsList.closest('.menu-item').querySelector('.menu-header');
        if (parentHeader) {
            // 确保 .sub-menu 处于展开状态
            preparedLessonsList.classList.add('show');
            // 如果你添加了 .expanded 类来显示箭头，也加上它
            parentHeader.querySelector('.menu-title').classList.add('expanded');
        }
    }
}


function renderPreparedLessons() {
    const preparedLessonsList = document.getElementById('prepared-lessons-list');
    if (!preparedLessonsList) {
        console.warn('侧边栏课程列表容器 #prepared-lessons-list 未找到，无法渲染。');
        return;
    }

    preparedLessonsList.innerHTML = '';

    const savedLessons = getSavedLessons();

    if (savedLessons.length === 0) {
        preparedLessonsList.innerHTML = '<li class="no-lesson-item">暂无已备课程</li>';
        // 如果没有课程，确保 sub-menu 是收起的
        const parentHeader = preparedLessonsList.closest('.menu-item').querySelector('.menu-header');
        if(parentHeader) {
            preparedLessonsList.classList.remove('show');
            parentHeader.querySelector('.menu-title').classList.remove('expanded');
        }
        return;
    }

    savedLessons.forEach(lesson => {
        const lessonName = lesson.courseName && lesson.courseName.trim() !== '' ?
                           lesson.courseName :
                           `新课程 (${lesson.id.substring(0, 8)}...)`;

        const listItem = document.createElement('li');
        listItem.classList.add('prepared-lesson-item');
        listItem.dataset.lessonId = lesson.id;

        let hoverInfo = `课程名称: ${lessonName}`;
        if (lesson.studentProfile) {
            hoverInfo += `\n学生特点: ${lesson.studentProfile}`;
        }
        if (lesson.lessonTime) {
            hoverInfo += `\n上课时间: ${lesson.lessonTime}`;
        }
        listItem.setAttribute('title', hoverInfo);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('lesson-item-content');
        contentDiv.textContent = lessonName;

        contentDiv.addEventListener('click', (event) => {
            event.preventDefault();
            console.log(`点击了侧边栏课程: ${lessonName}, ID: ${lesson.id}`);
            window.location.hash = `#/prepare-lesson?lessonId=${lesson.id}`;
            const sidebar = document.querySelector('.sidebar');
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.querySelectorAll('.menu-toggle').forEach(btn => btn.classList.remove('active'));
            }
        });
        listItem.appendChild(contentDiv);

        const deleteButton = document.createElement('span');
        deleteButton.textContent = '···';
        deleteButton.classList.add('delete-lesson-btn');
        deleteButton.title = '删除此课程';

        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            console.log(`点击删除按钮，课程ID: ${lesson.id}`);
            if (confirm(`确定要删除课程 "${lessonName}" 吗？`)) {
                deleteLesson(lesson.id);
            }
        });
        listItem.appendChild(deleteButton);

        preparedLessonsList.appendChild(listItem);
    });
    console.log('侧边栏课程列表已更新。');

    // **确保有课程时，"备课"子菜单是展开的**
    if (savedLessons.length > 0) {
        const parentHeader = preparedLessonsList.closest('.menu-item').querySelector('.menu-header');
        if (parentHeader) {
            preparedLessonsList.classList.add('show');
            // 如果你添加了 .expanded 类来显示箭头，也加上它
            parentHeader.querySelector('.menu-title').classList.add('expanded');
        }
    }
}

function deleteLesson(lessonIdToDelete) {
    let lessons = getSavedLessons();
    const updatedLessons = lessons.filter(lesson => lesson.id !== lessonIdToDelete);
    saveLessons(updatedLessons);

    console.log(`课程 ID: ${lessonIdToDelete} 已从 localStorage 删除。`);

    renderPreparedLessons();

    if (window.location.hash.startsWith('#/prepare-lesson')) {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const currentLessonIdOnPage = urlParams.get('lessonId');
        if (currentLessonIdOnPage === lessonIdToDelete) {
            console.log(`当前页面正在编辑被删除的课程，将跳转到创建新课程页面。`);
            window.location.hash = '#/prepare-lesson';
        }
    }
}

function setupNavLinks() {
    document.querySelectorAll('.navbar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                window.location.hash = href;
            }
        });
    });
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                window.location.hash = href;
                const sidebar = document.querySelector('.sidebar');
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    document.querySelectorAll('.menu-toggle').forEach(btn => btn.classList.remove('active'));
                }
            }
        });
    });
}

// =========================================================
// 应用启动和事件监听
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js DOMContentLoaded 触发，开始初始化应用...');

    loadNavbar();
    loadSidebar();

    startTime = new Date();
    const moodTrain = document.getElementById('usage-time');
    if (moodTrain) {
        moodTrain.innerHTML = '';
        moodTrain.style.width = '0';
    }
    updateMoodTrain();

    setInterval(updateCurrentTime, 1000);

    let lastMoodCount = -1;
    setInterval(() => {
        const minutes = Math.floor((new Date() - startTime) / (1000 * 60));
        const currentMoodCount = Math.floor(minutes / 30);
        if (currentMoodCount > lastMoodCount) {
            updateMoodTrain();
            lastMoodCount = currentMoodCount;
        }
    }, 60000);

    router();

    window.addEventListener('hashchange', router);

    document.addEventListener('lessonSaved', () => {
        console.log('接收到 lessonSaved 事件，重新渲染侧边栏。');
        renderPreparedLessons();
    });

    console.log('main.js 初始化完成。');
});