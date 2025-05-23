// js/prepare-lesson.js

// 导入数据存储函数，因为备课页面需要保存和加载课程
// 确保 dataStorage.js 正确导出了 getSavedLessons 和 saveLessons
import { getSavedLessons, saveLessons } from './dataStorage.js'; 

// prepareLessonPageHtml: 存储备课页面主要的 HTML 结构。
// 这部分内容是直接从你提供的 prepare-lesson.html 的 <main> 和模态框部分提取出来的。
// 使用反引号 (`) 定义多行字符串。
const prepareLessonPageHtml = `
    <main class="prepare-lesson-main">
        <h1></h1>
        <div class="lesson-cards-grid">
            <div class="lesson-card" data-field="courseName">
                <h2>课程名字</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="studentProfile">
                <h2>学生情况</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="lessonTime">
                <h2>上课时间</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="lessonCount">
                <h2>课时</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="duration">
                <h2>时长</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="requirements">
                <h2>课程要求</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card" data-field="outputFormat">
                <h2>输出格式</h2>
                <p class="card-content-display"></p>
            </div>

            <div class="lesson-card file-upload-card" data-field="fileUpload">
                <h2>文件上传</h2>
                <div class="upload-area">
                    <input type="file" multiple class="file-input" accept=".pdf,.jpg,.png,.docx,.mp4,.mp3,.html">
                    <p>拖拽文件到此区域或点击上传</p>
                    <p class="upload-formats">支持格式：PDF、JPG、PNG、DOCX、MP4、MP3、HTML</p>
                </div>
                <div class="uploaded-files">
                </div>
            </div>
        </div>
        <button class="save-lesson-btn">保存课程</button>
    </main>

    <div id="lessonModal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h3 id="modalTitle">填写信息</h3>
            <div class="modal-body">
            </div>
            <div class="modal-footer">
                <button id="modalSaveBtn">确定</button>
            </div>
        </div>
    </div>
`;

// setupLessonForm: 负责初始化备课页面。
// 这个函数会被 main.js 的路由调用。
// lessonId 参数可选，用于加载已保存的课程进行编辑。
export function setupLessonForm(lessonId = null) {
    console.log('setupLessonForm 被调用：正在渲染备课页面...');

    // 获取主内容区域（在 index.html 中定义）
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error('错误：未找到 .main-content 元素，无法渲染备课页面！');
        return;
    }

    // 将备课页面的 HTML 模板注入到主内容区域
    mainContent.innerHTML = prepareLessonPageHtml;

    // =============== 获取 DOM 元素 ==================
    // 注意：这些元素现在是在 mainContent.innerHTML 设置之后才存在的，所以必须在这里获取。
    const lessonCards = document.querySelectorAll('.lesson-card');
    const saveLessonBtn = document.querySelector('.save-lesson-btn');
    const modal = document.getElementById('lessonModal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = modal.querySelector('.modal-body');
    const modalSaveBtn = document.getElementById('modalSaveBtn');

    // 用于存储当前正在编辑的课程数据
    let currentLesson = {
        id: '',
        courseName: '',
        studentProfile: '',
        lessonTime: '',
        lessonCount: '',
        duration: '',
        requirements: '',
        outputFormat: '',
        files: [] // 存储上传的文件信息，如文件名和URL
    };

    // 如果传入了 lessonId，则加载该课程进行编辑
    if (lessonId) {
        loadLesson(lessonId);
    } else {
        // 如果是创建新课程，生成一个唯一的 ID
        currentLesson.id = generateUniqueId();
        // 设置默认的 h1 标题
        document.querySelector('.prepare-lesson-main h1').textContent = '创建新课程';
    }

    // =============== 事件监听器 ==================

    // 点击课程卡片，打开模态框进行编辑
    lessonCards.forEach(card => {
        card.addEventListener('click', () => {
            const field = card.dataset.field; // 获取卡片对应的字段名
            modalTitle.textContent = card.querySelector('h2').textContent; // 设置模态框标题
            renderModalBody(field, card.querySelector('.card-content-display').textContent); // 渲染模态框内容
            modal.style.display = 'block'; // 显示模态框
        });
    });

    // 点击模态框关闭按钮或背景，关闭模态框
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        modalBody.innerHTML = ''; // 清空模态框内容
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            modalBody.innerHTML = '';
        }
    });

    // 模态框保存按钮点击事件
    modalSaveBtn.addEventListener('click', () => {
        const field = modalBody.dataset.field; // 获取当前模态框对应的字段
        let value;

        // 根据字段类型获取模态框输入的值
        if (field === 'fileUpload') {
            // 文件上传不需要在这里处理保存按钮
            return; 
        } else if (field === 'lessonTime') {
            // 对于时间字段，需要特殊处理
            const date = document.getElementById('lesson-date-input').value;
            const time = document.getElementById('lesson-time-input').value;
            value = date && time ? `${date} ${time}` : '';
        } else {
            // 确保找到正确的输入元素：textarea 或 input
            const inputEl = modalBody.querySelector('textarea, input[type="text"], input[type="number"], select');
            value = inputEl ? inputEl.value : '';
        }

        // 更新 currentLesson 对象中的数据
        currentLesson[field] = value;
        // 更新页面上对应的卡片显示
        const displayElement = document.querySelector(`.lesson-card[data-field="${field}"] .card-content-display`);
        if (displayElement) {
            displayElement.textContent = value;
        }
        modal.style.display = 'none'; // 关闭模态框
    });

    // 保存课程按钮点击事件
    saveLessonBtn.addEventListener('click', () => {
        saveCurrentLesson(); // 保存当前课程到 localStorage
        // 触发一个自定义事件，通知侧边栏更新
        document.dispatchEvent(new CustomEvent('lessonSaved'));
        // 保存后，跳转到创建新课程的路由 (通过哈希路由)
        window.location.hash = '#/prepare-lesson'; // 跳转到创建新课程的路由
    });

    // 文件上传区域的拖拽和点击事件 (如果文件上传逻辑复杂，可以考虑独立成一个模块)
    const fileUploadCard = document.querySelector('.lesson-card[data-field="fileUpload"]');
    if (fileUploadCard) {
        const uploadArea = fileUploadCard.querySelector('.upload-area');
        const fileInput = fileUploadCard.querySelector('.file-input');
        const uploadedFilesContainer = fileUploadCard.querySelector('.uploaded-files');

        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 拖拽文件进入区域时添加高亮
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('highlight'), false);
        });

        // 拖拽文件离开区域时移除高亮
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('highlight'), false);
        });

        // 处理文件拖放
        uploadArea.addEventListener('drop', handleDrop, false);
        // 处理文件输入框的change事件
        fileInput.addEventListener('change', handleFiles, false);
        // 点击上传区域触发文件输入框点击
        uploadArea.addEventListener('click', () => fileInput.click());

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles({ target: { files: files } });
        }

        function handleFiles(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // 存储文件信息：名称和 base64 编码 (或一个临时 URL)
                    const fileInfo = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataUrl: e.target.result // base64 编码
                    };
                    currentLesson.files.push(fileInfo);
                    renderUploadedFiles(); // 更新显示
                };
                reader.readAsDataURL(file); // 读取文件为 Data URL
            });
        }

        // 渲染已上传文件列表
        function renderUploadedFiles() {
            uploadedFilesContainer.innerHTML = ''; // 清空现有列表
            if (currentLesson.files.length === 0) {
                uploadedFilesContainer.innerHTML = '<p class="no-files">暂无文件</p>';
                return;
            }
            currentLesson.files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('uploaded-file-item');
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <button class="delete-file-btn" data-index="${index}">&times;</button>
                `;
                uploadedFilesContainer.appendChild(fileItem);
            });

            // 为删除按钮添加事件监听
            uploadedFilesContainer.querySelectorAll('.delete-file-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const indexToDelete = parseInt(event.target.dataset.index);
                    currentLesson.files.splice(indexToDelete, 1); // 从数组中删除
                    renderUploadedFiles(); // 重新渲染
                });
            });
        }
    }

    // =============== 辅助函数 ==================

    /**
     * 根据字段类型渲染模态框内容。
     * @param {string} field - 字段名 (如 'courseName', 'lessonTime')。
     * @param {string} currentValue - 当前字段的值。
     */
    function renderModalBody(field, currentValue) {
        modalBody.innerHTML = ''; // 清空模态框内容
        modalBody.dataset.field = field; // 存储当前编辑的字段

        let inputElement;

        switch (field) {
            case 'courseName':
            case 'studentProfile':
            case 'requirements':
            case 'outputFormat':
                // 文本输入或文本区域
                inputElement = document.createElement('textarea');
                inputElement.value = currentValue;
                inputElement.rows = 5;
                break;
            case 'lessonTime':
                // 日期和时间输入
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.id = 'lesson-date-input';
                const timeInput = document.createElement('input');
                timeInput.type = 'time';
                timeInput.id = 'lesson-time-input';

                if (currentValue) {
                    const [datePart, timePart] = currentValue.split(' ');
                    dateInput.value = datePart || '';
                    timeInput.value = timePart || '';
                }
                modalBody.appendChild(dateInput);
                modalBody.appendChild(timeInput);
                break;
            case 'lessonCount':
            case 'duration':
                // 数字输入
                inputElement = document.createElement('input');
                inputElement.type = 'number';
                inputElement.value = currentValue;
                break;
            case 'fileUpload':
                // 文件上传卡片不需要模态框编辑，点击它应该直接激活上传区域
                // 如果需要在这个模态框里显示已上传文件并管理，需要复杂逻辑
                // 目前此分支不会被触发，因为文件上传直接在卡片上处理
                modalBody.innerHTML = '<p>请直接在卡片区域拖拽或点击上传文件。</p>';
                return; // 返回，不再添加 inputElement
            default:
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
        }

        if (inputElement) {
            inputElement.classList.add('modal-input');
            modalBody.appendChild(inputElement);
        }
    }

    /**
     * 加载指定 ID 的课程数据并填充到表单中。
     * @param {string} id - 要加载的课程 ID。
     */
    function loadLesson(id) {
        const savedLessons = getSavedLessons();
        const lessonToLoad = savedLessons.find(lesson => lesson.id === id);

        if (lessonToLoad) {
            currentLesson = { ...lessonToLoad }; // 复制课程数据
            document.querySelector('.prepare-lesson-main h1').textContent = `编辑课程: ${currentLesson.courseName || '未命名'}`;

            // 遍历所有卡片并填充数据
            lessonCards.forEach(card => {
                const field = card.dataset.field;
                const displayElement = card.querySelector('.card-content-display');
                if (displayElement && currentLesson[field] !== undefined) { // 检查值是否存在
                    displayElement.textContent = currentLesson[field];
                }
            });
            // 重新渲染已上传的文件列表
            renderUploadedFiles();
            console.log('课程加载成功:', currentLesson);
        } else {
            console.warn(`未找到 ID 为 ${id} 的课程，将创建新课程。`);
            currentLesson.id = generateUniqueId(); // 仍然生成一个新ID
            document.querySelector('.prepare-lesson-main h1').textContent = '创建新课程';
        }
    }

    /**
     * 保存当前课程数据到 localStorage。
     */
    function saveCurrentLesson() {
        // 更新 h1 标题，如果课程名称存在
        if (currentLesson.courseName) {
            document.querySelector('.prepare-lesson-main h1').textContent = `编辑课程: ${currentLesson.courseName}`;
        }

        let lessons = getSavedLessons();
        // 查找是否已存在相同 ID 的课程
        const existingIndex = lessons.findIndex(lesson => lesson.id === currentLesson.id);

        if (existingIndex !== -1) {
            // 更新现有课程
            lessons[existingIndex] = { ...currentLesson }; // 确保更新所有字段
            console.log('课程已更新:', currentLesson);
        } else {
            // 添加新课程
            lessons.push(currentLesson);
            console.log('新课程已保存:', currentLesson);
        }
        saveLessons(lessons); // 保存到 localStorage
    }

    /**
     * 生成一个唯一的 ID。
     * @returns {string} 唯一的 ID。
     */
    function generateUniqueId() {
        return 'lesson-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // 确保首次加载时，如果有文件则渲染已上传文件列表
    renderUploadedFiles();
}