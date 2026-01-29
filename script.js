class DataStore {
    constructor() {
        this.STORAGE_KEY = 'lifeos_data_v1';
        this.data = this.load();
    }
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.error('DataStore Load Error:', e);
            alert('Error loading data. Resetting storage.');
            localStorage.removeItem(this.STORAGE_KEY);
        }
        return {
            user: { name: 'Dheeraj', status: 'Focus Mode', xp: 0, level: 1 },
            tasks: [],
            habits: [],
            goals: []
        };
    }
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            this.notify('dataChanged');
        } catch (e) {
            console.error('Save Error:', e);
        }
    }
    addXP(amount) {
        this.data.user.xp = (this.data.user.xp || 0) + amount;
        const newLevel = Math.floor(1 + Math.sqrt(this.data.user.xp / 100));
        if (newLevel > (this.data.user.level || 1)) {
            this.data.user.level = newLevel;
            alert(`Level Up! You are now Level ${newLevel}`);
        }
        this.save();
    }
    addTask(task) {
        this.data.tasks.push(task);
        this.save();
    }
    deleteTask(id) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== id);
        this.save();
    }
    updateTaskStatus(id, newStatus) {
        const task = this.data.tasks.find(t => t.id === id);
        if (task && task.status !== newStatus) {
            if (task.status === 'done' && newStatus !== 'done') {
                this.addXP(-10);
                delete task.completedAt;
            }
            task.status = newStatus;
            if (newStatus === 'done') {
                this.addXP(10);
                task.completedAt = new Date().toISOString();
            }
            this.save();
        }
    }
    addHabit(habit) {
        this.data.habits.push(habit);
        this.save();
    }
    toggleHabit(id, date) {
        const habit = this.data.habits.find(h => h.id === id);
        if (habit) {
            if (habit.history[date]) {
                delete habit.history[date];
                this.addXP(-5); 
            } else {
                habit.history[date] = true;
                this.addXP(5); 
            }
            this.save();
        }
    }
    addGoal(goal) {
        goal.progress = 0;
        this.data.goals.push(goal);
        this.save();
    }
    deleteGoal(id) {
        this.data.goals = this.data.goals.filter(g => g.id !== id);
        this.save();
    }
    updateGoalProgress(id, progress) {
        const goal = this.data.goals.find(g => g.id === id);
        if (goal) {
            goal.progress = parseInt(progress);
            if (goal.progress >= 100 && !goal.completedAt) {
                this.addXP(20);
                goal.completedAt = new Date().toISOString();
                alert('Goal Completed! +20 XP');
            }
            this.save();
        }
    }
    updateGoalNumeric(id, val) {
        const goal = this.data.goals.find(g => g.id === id);
        if (goal) {
            goal.currentValue = parseFloat(val);
            if (goal.targetValue > 0) {
                goal.progress = Math.min(100, Math.floor((goal.currentValue / goal.targetValue) * 100));
            }
            if (goal.currentValue >= goal.targetValue && !goal.completedAt) {
                this.addXP(30);
                goal.completedAt = new Date().toISOString();
                alert('Goal Target Reached! +30 XP');
            }
            this.save();
        }
    }
    subscribe(callback) {
        if (!this.listeners) this.listeners = [];
        this.listeners.push(callback);
    }
    notify(event) {
        if (this.listeners) {
            this.listeners.forEach(cb => cb(this.data));
        }
    }
}
const store = new DataStore();
class FocusController {
    constructor() {
        this.duration = 25 * 60;
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.interval = null;
        this.timerText = document.getElementById('timer-text');
        this.timerStatus = document.getElementById('timer-status');
        this.progressRing = document.getElementById('timer-progress');
        this.toggleBtn = document.getElementById('timer-toggle');
        this.resetBtn = document.getElementById('timer-reset');
        this.durationSelect = document.getElementById('focus-duration');
        this.circumference = 2 * Math.PI * 130;
        this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.initListeners();
    }
    initListeners() {
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.durationSelect.addEventListener('change', (e) => {
            this.duration = parseInt(e.target.value) * 60;
            this.reset();
        });
    }
    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }
    start() {
        this.isRunning = true;
        this.toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.interval = setInterval(() => this.tick(), 1000);
    }
    pause() {
        this.isRunning = false;
        this.toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        clearInterval(this.interval);
    }
    reset() {
        this.pause();
        this.timeLeft = this.duration;
        this.updateDisplay();
        this.setProgress(1);
    }
    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
            this.setProgress(this.timeLeft / this.duration);
        } else {
            this.complete();
        }
    }
    updateDisplay() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        this.timerText.textContent = `${m}:${s}`;
    }
    setProgress(percent) {
        const offset = this.circumference - (percent * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }
    complete() {
        this.pause();
        alert('Focus Session Complete! +50 XP');
        store.addXP(50);
        this.reset();
    }
}
class AnalyticsController {
    constructor() {
        this.engine = new ChartEngine();
        store.subscribe(() => this.update());
        setTimeout(() => this.update(), 500);
    }
    update() {
        if (document.getElementById('productivityChart')) {
            const last7Days = this.getLast7Days();
            const data = last7Days.map(dateLabel => {
                return store.data.tasks.filter(t => {
                    if (!t.completedAt) return false;
                    const cDate = new Date(t.completedAt).toLocaleDateString('en-CA'); 
                    return cDate === dateLabel;
                }).length;
            });
            const labels = last7Days.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            });
            this.engine.drawLineChart('productivityChart', data, labels);
        }
        if (document.getElementById('habitHeatmap')) {
            const historyMap = {};
            store.data.habits.forEach(h => {
                Object.keys(h.history).forEach(date => {
                    historyMap[date] = (historyMap[date] || 0) + 1;
                });
            });
            const maxHabits = store.data.habits.length || 1;
            this.engine.drawHeatmap('habitHeatmap', historyMap, maxHabits);
        }
    }
    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-CA'));
        }
        return days;
    }
}
class TaskController {
    constructor() {
        this.todoList = document.getElementById('todo-list');
        this.inprogressList = document.getElementById('inprogress-list');
        this.doneList = document.getElementById('done-list');
        store.subscribe(() => this.render());
        this.render();
    }
    render() {
        this.todoList.innerHTML = '';
        this.inprogressList.innerHTML = '';
        this.doneList.innerHTML = '';
        store.data.tasks.forEach(task => {
            const card = this.createTaskCard(task);
            if (task.status === 'todo') this.todoList.appendChild(card);
            else if (task.status === 'inprogress') this.inprogressList.appendChild(card);
            else if (task.status === 'done') this.doneList.appendChild(card);
        });
    }
    createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'task-card-item';
        div.draggable = true;
        div.id = task.id;
        let priorityColor = '#6366f1';
        if (task.priority === 'High') priorityColor = '#ec4899';
        if (task.priority === 'Low') priorityColor = '#10b981';
        if (task.priority === 'Medium') priorityColor = '#0ea5e9';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 8px;">
                <span style="font-size:12px; padding:2px 8px; border-radius:12px; background:${priorityColor}33; color:${priorityColor}; border:1px solid ${priorityColor}66;">
                    ${task.priority}
                </span>
                <button class="delete-task-btn" onclick="window.app.taskController.delete('${task.id}')" style="background:none; border:none; color:#64748b; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <h4 style="margin-bottom:4px; font-weight:500;">${task.title}</h4>
            <p style="font-size:12px; color:#94a3b8;">${task.desc || ''}</p>
        `;
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            div.classList.add('dragging');
        });
        div.addEventListener('dragend', (e) => {
            div.classList.remove('dragging');
        });
        return div;
    }
    delete(id) {
        if (confirm('Delete this task?')) {
            store.deleteTask(id);
        }
    }
    setupDragDrop() {
        [this.todoList, this.inprogressList, this.doneList].forEach(zone => {
            zone.parentNode.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.parentNode.style.background = 'rgba(255,255,255,0.05)';
            });
            zone.parentNode.addEventListener('dragleave', (e) => {
                zone.parentNode.style.background = 'rgba(255,255,255,0.02)';
            });
            zone.parentNode.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.parentNode.style.background = 'rgba(255,255,255,0.02)';
                const id = e.dataTransfer.getData('text/plain');
                if (!id) return;
                const newStatus = zone.id.replace('-list', '');
                store.updateTaskStatus(id, newStatus);
            });
        });
    }
}
class HabitController {
    constructor() {
        this.container = document.getElementById('habits-container');
        store.subscribe(() => this.render());
        this.render();
    }
    render() {
        this.container.innerHTML = '';
        store.data.habits.forEach(habit => {
            this.container.appendChild(this.createHabitCard(habit));
        });
    }
    createHabitCard(habit) {
        const div = document.createElement('div');
        div.className = 'habit-card';
        const today = new Date().toLocaleDateString('en-CA');
        const isDone = habit.history[today];
        const streak = this.calculateStreak(habit);
        div.innerHTML = `
            <div class="habit-info">
                <h4>${habit.title}</h4>
                <div class="habit-streak"><i class="fa-solid fa-fire"></i> ${streak} Day Streak</div>
            </div>
            <div class="habit-checkbox ${isDone ? 'done' : ''}" onclick="window.app.habitController.toggle('${habit.id}')">
                <i class="fa-solid fa-check" style="display:${isDone ? 'block' : 'none'}"></i>
            </div>
        `;
        return div;
    }
    toggle(id) {
        const today = new Date().toLocaleDateString('en-CA');
        store.toggleHabit(id, today);
    }
    calculateStreak(habit) {
        let streak = 0;
        const today = new Date().toLocaleDateString('en-CA');
        return Object.keys(habit.history).length;
    }
}
class GoalController {
    constructor() {
        this.container = document.getElementById('goals-container');
        store.subscribe(() => this.render());
        this.render();
    }
    render() {
        this.container.innerHTML = '';
        store.data.goals.forEach(goal => {
            this.container.appendChild(this.createGoalCard(goal));
        });
    }
    createGoalCard(goal) {
        const div = document.createElement('div');
        div.className = 'goal-card';
        const progress = goal.progress || 0;
        const isCompleted = progress >= 100;
        let dateStr = 'No Deadline';
        if (goal.date) {
            const d = new Date(goal.date);
            if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleDateString();
            }
        }
        let progressContent = '';
        if (isCompleted) {
            progressContent = `
                <div style="margin-top:12px; padding:12px; background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.2); border-radius:12px; display:flex; align-items:center; gap:8px; color:#10b981;">
                    <i class="fa-solid fa-check-circle"></i>
                    <span style="font-weight:600; font-size:14px;">Goal Completed</span>
                </div>
            `;
        } else {
            progressContent = `
                <div class="goal-progress-container">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px; color:var(--text-primary);">
                        <span>Progress</span>
                        <span id="progress-val-${goal.id}">${progress}%</span>
                    </div>
                    <input type="range" class="glass-slider" min="0" max="100" value="${progress}" 
                        oninput="window.app.goalController.updateProgress('${goal.id}', this.value)">
                </div>
            `;
        }
        div.innerHTML = `
            <div class="goal-header">
                <div>
                    <h3>${goal.title}</h3>
                    <p style="font-size:12px; color:var(--text-secondary);">Target: ${dateStr}</p>
                </div>
                <button onclick="window.app.goalController.delete('${goal.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            ${progressContent}
        `;
        return div;
    }
    updateProgress(id, value) {
        const label = document.getElementById(`progress-val-${id}`);
        if (label) label.textContent = `${value}%`;
        store.updateGoalProgress(id, value);
    }
    delete(id) {
        if (confirm('Delete goal?')) store.deleteGoal(id);
    }
}
class ModalController {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.closeButtons = document.querySelectorAll('.close-modal');
        this.form = document.getElementById('details-form');
        this.saveBtn = document.getElementById('save-item-btn');
        this.title = document.getElementById('modal-title');
        this.closeButtons.forEach(btn => btn.addEventListener('click', () => this.hide()));
        document.getElementById('add-task-btn').addEventListener('click', () => this.show('task'));
        document.getElementById('add-habit-btn').addEventListener('click', () => this.show('habit'));
        document.getElementById('add-goal-btn').addEventListener('click', () => this.show('goal'));
        this.currentType = null;
        this.saveBtn.addEventListener('click', () => this.handleSave());
    }
    show(type) {
        this.currentType = type;
        this.overlay.classList.remove('hidden');
        this.renderForm(type);
    }
    hide() {
        this.overlay.classList.add('hidden');
        this.currentType = null;
    }
    renderForm(type) {
        this.form.innerHTML = '';
        if (type === 'task') {
            this.title.textContent = 'New Task';
            this.form.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <input type="text" id="inp-title" placeholder="Task Title" class="glass-input" required>
                    <textarea id="inp-desc" placeholder="Description (Optional)" class="glass-input" rows="3"></textarea>
                    <select id="inp-priority" class="glass-input">
                        <option value="Low">Low Priority</option>
                        <option value="Medium" selected>Medium Priority</option>
                        <option value="High">High Priority</option>
                    </select>
                </div>
            `;
        } else if (type === 'habit') {
            this.title.textContent = 'New Habit';
            this.form.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <input type="text" id="inp-title" placeholder="Habit Name" class="glass-input" required>
                    <select id="inp-freq" class="glass-input">
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                    </select>
                </div>
            `;
        } else if (type === 'goal') {
            this.title.textContent = 'New Goal';
            this.form.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <input type="text" id="inp-title" placeholder="Goal Title" class="glass-input" required>
                    <label style="color:var(--text-secondary); font-size:12px; margin-bottom:-8px;">Goal Type</label>
                    <select id="inp-goal-type" class="glass-input" onchange="window.app.modal.toggleGoalFields(this.value)">
                        <option value="simple">Simple (0-100%)</option>
                        <option value="numeric">Custom Target (e.g. Money)</option>
                    </select>
                    <div id="numeric-fields" style="display:none; flex-direction:column; gap:16px;">
                        <input type="number" id="inp-target" placeholder="Target Amount (e.g. 5000)" class="glass-input">
                        <input type="text" id="inp-unit" placeholder="Unit (e.g. $)" class="glass-input">
                    </div>
                    <input type="date" id="inp-date" class="glass-input">
                </div>
            `;
        }
    }
    toggleGoalFields(type) {
        const fields = document.getElementById('numeric-fields');
        if (fields) fields.style.display = type === 'numeric' ? 'flex' : 'none';
    }
    handleSave() {
        const title = document.getElementById('inp-title').value;
        if (!title) return alert('Title is required');
        const id = Date.now().toString();
        if (this.currentType === 'task') {
            const desc = document.getElementById('inp-desc').value;
            const priority = document.getElementById('inp-priority').value;
            store.addTask({
                id,
                title,
                desc,
                priority,
                status: 'todo',
                createdAt: new Date().toISOString()
            });
        } else if (this.currentType === 'habit') {
            const freq = document.getElementById('inp-freq').value;
            store.addHabit({ id, title, freq, history: {}, createdAt: new Date().toISOString() });
        } else if (this.currentType === 'goal') {
            const date = document.getElementById('inp-date').value;
            if (!date) return alert('Target Date is required');
            const type = document.getElementById('inp-goal-type').value;
            let targetValue = 0;
            let unit = '';
            if (type === 'numeric') {
                targetValue = parseFloat(document.getElementById('inp-target').value);
                if (!targetValue) return alert('Target Value is required');
                unit = document.getElementById('inp-unit').value || '';
            }
            store.addGoal({
                id,
                title,
                date,
                type,
                targetValue,
                currentValue: 0,
                unit,
                createdAt: new Date().toISOString()
            });
        }
        this.hide();
    }
}
class NavigationController {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-links li');
        this.sections = document.querySelectorAll('.page-section');
        this.init();
    }
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const target = link.dataset.target;
                this.switchView(target);
            });
        });
        this.switchView('dashboard');
    }
    switchView(viewName) {
        this.navLinks.forEach(link => {
            if (link.dataset.target === viewName) link.classList.add('active');
            else link.classList.remove('active');
        });
        this.sections.forEach(section => {
            if (section.id === viewName) section.classList.add('active');
            else section.classList.remove('active');
        });
    }
}
class ProfileController {
    constructor() {
        this.nameInput = document.getElementById('profile-name');
        this.bioInput = document.getElementById('profile-bio');
        this.saveBtn = document.getElementById('profile-save-btn');
        this.render();
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.save());
        }
    }
    render() {
        const user = store.data.user;
        if (this.nameInput) this.nameInput.value = user.name || '';
        if (this.bioInput) this.bioInput.value = user.status || '';
        if (document.getElementById('profile-level')) {
            document.getElementById('profile-level').textContent = `Lvl ${user.level || 1}`;
            document.getElementById('profile-xp').textContent = `${Math.floor(user.xp || 0)} XP`;
            const tasksDone = store.data.tasks.filter(t => t.status === 'done').length;
            document.getElementById('profile-tasks').textContent = tasksDone;
            let habitCheckins = 0;
            store.data.habits.forEach(h => {
                habitCheckins += Object.keys(h.history).length;
            });
            document.getElementById('profile-habits').textContent = habitCheckins;
        }
    }
    save() {
        const name = this.nameInput.value;
        const status = this.bioInput.value;
        if (!name) return alert('Name is required');
        store.data.user.name = name;
        store.data.user.status = status;
        store.save();
        alert('Profile Saved!');
        if (window.app.dashboard) window.app.dashboard.updateGreeting();
    }
}
class DashboardController {
    constructor() {
        this.dateDisplay = document.getElementById('date-display');
        this.greeting = document.getElementById('greeting');
        this.init();
        store.subscribe(() => this.updateStats());
    }
    init() {
        this.updateDate();
        this.updateGreeting();
        this.updateStats();
        this.currentDay = new Date().getDate();
        setInterval(() => {
            this.updateDate();
            this.updateGreeting();
            const nowDay = new Date().getDate();
            if (nowDay !== this.currentDay) {
                this.currentDay = nowDay;
                if (window.app.analytics) window.app.analytics.update();
                if (window.app.goalController) window.app.goalController.render();
                if (window.app.goalController) window.app.goalController.render();
                if (window.app.habitController) window.app.habitController.render();
            }
        }, 60000);
    }
    updateDate() {
        const now = new Date();
        this.dateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    updateGreeting() {
        const h = new Date().getHours();
        const timeGreeting = h < 12 ? 'Good Morning' : (h < 18 ? 'Good Afternoon' : 'Good Evening');
        const name = store.data.user.name || 'User';
        this.greeting.textContent = `${timeGreeting}, ${name}`;
        const sidebarName = document.querySelector('.user-info .name');
        if (sidebarName) sidebarName.textContent = name;
        const sidebarStatus = document.querySelector('.user-info .status');
        if (sidebarStatus) sidebarStatus.textContent = store.data.user.status || 'No Status';
    }
    updateStats() {
        const data = store.data;
        const totalTasks = data.tasks.length;
        const doneTasks = data.tasks.filter(t => t.status === 'done').length;
        let totalStreak = 0;
        data.habits.forEach(h => {
            totalStreak += Object.keys(h.history).length;
        });
        const elTasks = document.getElementById('dash-tasks-done');
        if (elTasks) elTasks.textContent = `${doneTasks}/${totalTasks}`;
        const elStreak = document.getElementById('dash-streak');
        if (elStreak) elStreak.textContent = `${totalStreak} pts`;
        const user = data.user;
        const level = user.level || 1;
        const xp = user.xp || 0;
        const nextLevelXP = Math.pow(level, 2) * 100;
        const prevLevelXP = Math.pow(level - 1, 2) * 100;
        const progress = Math.min(100, ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100);
        const elLevel = document.getElementById('dash-level');
        if (elLevel) elLevel.textContent = `Lvl ${level}`;
        const elUserLevel = document.getElementById('user-level');
        if (elUserLevel) elUserLevel.textContent = level;
        const elXpText = document.getElementById('xp-text');
        if (elXpText) elXpText.textContent = `${Math.floor(xp)} XP`;
        const xpBar = document.getElementById('user-xp-bar');
        if (xpBar) xpBar.style.width = `${progress}%`;
        const prod = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        const elProd = document.getElementById('dash-productivity');
        if (elProd) elProd.textContent = `${prod}%`;
    }
}
window.app = {};
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app.nav = new NavigationController();
        window.app.dashboard = new DashboardController();
        window.app.modal = new ModalController();
        window.app.taskController = new TaskController();
        window.app.habitController = new HabitController();
        window.app.goalController = new GoalController();
        window.app.focusController = new FocusController();
        window.app.analytics = new AnalyticsController();
        window.app.profileController = new ProfileController();
        window.app.taskController.setupDragDrop();
        console.log('LifeOS Loaded.');
    } catch (e) {
        console.error('App Init failed:', e);
        alert('App Error: ' + e.message);
    }
});
