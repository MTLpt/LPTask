//ดึงข้อมูลงานจากฐานข้อมูลเครื่อง
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [];

// Calendar State
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// State for editing tasks
let editingTaskId = null;
let editingCategoryId = null; // State for editing categories

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    updateCategorySelect();
    renderCategories();
    switchView('list'); // Start with list view
    renderCalendar();
});

// Save to LocalStorage
function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
}

// === UI Navigation ===
function switchView(view) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${view}View`)?.classList.add('active'); // Use optional chaining for safety
    
    const viewTitle = document.getElementById('viewTitle');
    if(view === 'list') {
        viewTitle.innerHTML = '📝 <span class="gradient-text">รายการงานทั้งหมด</span>';
        renderTasks();
        document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
    } else if (view === 'calendar') {
        viewTitle.innerHTML = '📅 <span class="gradient-text">ปฏิทินงาน</span>';
        renderCalendar();
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active');
    } else {
        viewTitle.innerHTML = '✅ <span class="gradient-text">งานที่สำเร็จแล้ว</span>';
        renderCompletedTasks();
        document.querySelector('.nav-btn:nth-child(3)').classList.add('active');
    }
}

// === Modals ===
function openCategoryModal() { 
    editingCategoryId = null; // Ensure we are adding a new category
    document.getElementById('categoryModalTitle').innerText = "สร้างหมวดหมู่ใหม่";
    document.getElementById('saveCategoryBtn').innerText = "บันทึก";
    document.getElementById('catName').value = ""; // Clear form
    document.getElementById('catColor').value = "#87CEEB"; // Reset color
    document.getElementById('categoryModal').style.display = 'flex'; 
}

function openAddTaskModal() {
    editingTaskId = null; // Ensure we are adding a new task
    document.getElementById('taskModalTitle').innerText = "เพิ่มงานใหม่";
    document.getElementById('saveTaskBtn').innerText = "บันทึกงาน";
    resetTaskForm();
    document.getElementById('taskModal').style.display = 'flex';
}

function closeModals() {
    editingTaskId = null; // Clear editing state when any modal closes
    editingCategoryId = null; // Clear editing state for categories
    document.getElementById('categoryModal').style.display = 'none';
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('dayTasksModal').style.display = 'none';
}

function resetTaskForm() {
    document.getElementById('taskTitle').value = "";
    document.getElementById('taskDate').value = "";
    document.getElementById('taskTime').value = "";
    document.getElementById('taskCategory').value = "";
    document.querySelector('input[name="priority"][value="yellow"]').checked = true;
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDate').value = task.date || "";
    document.getElementById('taskTime').value = task.time || "";
    document.getElementById('taskCategory').value = task.categoryId || "";
    document.querySelector(`input[name="priority"][value="${task.priority}"]`).checked = true;
    
    document.getElementById('taskModalTitle').innerText = "แก้ไขงาน";
    document.getElementById('saveTaskBtn').innerText = "บันทึกการแก้ไข";
    document.getElementById('taskModal').style.display = 'flex';
}

function editCategory(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    
    editingCategoryId = categoryId;
    document.getElementById('catName').value = cat.name;
    document.getElementById('catColor').value = cat.color;
    
    document.getElementById('categoryModalTitle').innerText = "แก้ไขหมวดหมู่";
    document.getElementById('saveCategoryBtn').innerText = "บันทึกการแก้ไข";
    document.getElementById('categoryModal').style.display = 'flex';
}

// === Categories Logic ===
function saveCategory() {
    const name = document.getElementById('catName').value;
    const color = document.getElementById('catColor').value;
    if (!name) return alert("กรุณากรอกชื่อหมวดหมู่");

    if (editingCategoryId) {
        const catIndex = categories.findIndex(c => c.id === editingCategoryId);
        if (catIndex !== -1) {
            categories[catIndex] = { ...categories[catIndex], name, color };
        }
    } else {
        const newCategory = { id: Date.now().toString(), name, color };
        categories.push(newCategory);
    }

    saveData();
    
    document.getElementById('catName').value = "";
    closeModals();
    renderCategories();
    updateCategorySelect();
    
    // Re-render tasks to update category badges if name or color changed
    renderTasks();
    renderCompletedTasks();
    renderCalendar();
}

function renderCategories() {
    const list = document.getElementById('categoryList');
    list.innerHTML = "";
    categories.forEach(cat => {
        list.innerHTML += `
            <div class="category-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="cat-color-dot" style="background-color: ${cat.color};"></span>
                    ${cat.name}
                </div>
                <div>
                    <button onclick="editCategory('${cat.id}')" style="background: none; border: none; cursor: pointer; font-size: 14px; margin-right: 5px;" title="แก้ไขหมวดหมู่">✏️</button>
                    <button onclick="deleteCategory('${cat.id}')" style="background: none; border: none; cursor: pointer; font-size: 14px;" title="ลบหมวดหมู่">🗑️</button>
                </div>
            </div>
        `;
    });
}

function deleteCategory(categoryId) {
    if(confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? (งานที่อยู่ในหมวดหมู่นี้จะถูกเปลี่ยนเป็น 'ไม่เลือกหมวดหมู่')")) {
        categories = categories.filter(c => c.id !== categoryId);
        
        // อัปเดตงานที่เคยใช้หมวดหมู่นี้ให้กลายเป็นไม่มีหมวดหมู่
        tasks = tasks.map(t => {
            if (t.categoryId === categoryId) {
                return { ...t, categoryId: "" };
            }
            return t;
        });

        saveData();
        renderCategories();
        updateCategorySelect();
        renderTasks();
        renderCompletedTasks();
        renderCalendar();
    }
}

function updateCategorySelect() {
    const select = document.getElementById('taskCategory');
    select.innerHTML = '<option value="">-- ไม่เลือกหมวดหมู่ --</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

// === Tasks Logic ===
function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const categoryId = document.getElementById('taskCategory').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;

    if (!title) return alert("กรุณากรอกชื่องาน");

    if (editingTaskId) {
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], title, date, time, categoryId, priority };
        }
    } else {
        const newTask = {
            id: Date.now().toString(),
            title, date, time, categoryId, priority,
            completed: false
        };
        tasks.push(newTask);
    }

    saveData();
    
    closeModals();
    
    renderTasks();
    renderCompletedTasks();
    renderCalendar();
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
        renderCompletedTasks();
        renderCalendar();
        document.getElementById('dayTasksModal').style.display = 'none';
    }
}

function deleteTask(taskId) {
    if(confirm("คุณต้องการลบงานนี้ใช่หรือไม่?")) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        renderTasks();
        renderCompletedTasks();
        renderCalendar();
        document.getElementById('dayTasksModal').style.display = 'none';
    }
}

function getCategoryBadge(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    if(cat) return `<span class="cat-badge" style="background-color: ${cat.color}">${cat.name}</span>`;
    return "";
}

function buildTaskHTML(task) {
    return `
        <div class="task-card priority-${task.priority}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')" style="width:18px; height:18px;">
            <div class="task-info">
                <div class="task-title" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.title}</div>
                <div class="task-meta">
                    ${task.date ? `<span>📅 ${task.date}</span>` : ''}
                    ${task.time ? `<span>⏰ ${task.time}</span>` : ''}
                    ${getCategoryBadge(task.categoryId)}
                </div>
            </div>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')">✏️</button>
                <button onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        </div>
    `;
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const activeTasks = tasks.filter(t => !t.completed);
    
    if(activeTasks.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>เย้! ไม่มีงานค้างแล้ว 🎉</p>";
    } else {
        container.innerHTML = activeTasks.map(buildTaskHTML).join('');
    }
}

function renderCompletedTasks() {
    const container = document.getElementById('completedTasksContainer');
    const completedTasks = tasks.filter(t => t.completed);
    
    if(completedTasks.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>ยังไม่มีงานที่ทำเสร็จแล้ว</p>";
    } else {
        container.innerHTML = completedTasks.map(buildTaskHTML).join('');
    }
}

// === Calendar Logic ===
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function renderCalendar() {
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('monthYearDisplay').innerText = `${monthNames[currentMonth]} ${currentYear}`;
    
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before start of month
    for(let i = 0; i < firstDay; i++) {
        daysContainer.innerHTML += `<div class="cal-day" style="background: transparent; box-shadow: none;"></div>`;
    }

    // Days with tasks
    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Find tasks for this date (Not completed)
        const dayTasks = tasks.filter(t => t.date === dateStr && !t.completed);
        
        let dotsHTML = "";
        dayTasks.forEach(t => {
            let color = t.priority === 'red' ? '#ff4757' : (t.priority === 'yellow' ? '#ffa502' : '#2ed573');
            dotsHTML += `<span class="cal-task-dot" style="background-color: ${color};" title="${t.title}"></span>`;
        });

        daysContainer.innerHTML += `
            <div class="cal-day clickable-day" onclick="openDayTasksModal('${dateStr}', ${i}, ${currentMonth}, ${currentYear})">
                <div class="cal-day-number">${i}</div>
                <div>${dotsHTML}</div>
            </div>
        `;
    }
}

function openDayTasksModal(dateStr, day, month, year) {
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('dayTasksModalTitle').innerText = `งานประจำวันที่ ${day} ${monthNames[month]} ${year}`;
    
    const container = document.getElementById('dayTasksList');
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    if(dayTasks.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>ไม่มีงานในวันนี้</p>";
    } else {
        container.innerHTML = dayTasks.map(buildTaskHTML).join('');
    }
    
    document.getElementById('dayTasksModal').style.display = 'flex';
}
