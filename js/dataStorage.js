// js/dataStorage.js

/**
 * 从 localStorage 获取保存的课程列表。
 * @returns {Array<Object>} 课程数组，如果没有则返回空数组。
 */
export function getSavedLessons() {
    try {
        const lessons = localStorage.getItem('lessons');
        return lessons ? JSON.parse(lessons) : [];
    } catch (e) {
        console.error("从 localStorage 读取课程失败:", e);
        return [];
    }
}

/**
 * 将课程列表保存到 localStorage。
 * @param {Array<Object>} lessons - 要保存的课程数组。
 */
export function saveLessons(lessons) {
    try {
        localStorage.setItem('lessons', JSON.stringify(lessons));
    } catch (e) {
        console.error("保存课程到 localStorage 失败:", e);
    }
}