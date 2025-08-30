class CIToolApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.pipelines = {};
        this.jobs = {};
        this.logs = [];
        this.dbConnection = {
            status: 'disconnected',
            config: {}
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
        this.loadSettings();
        this.updateDbStatus();
        this.startPolling();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToSection(e.target.closest('.nav-btn').dataset.section);
            });
        });

        // Modal
        document.querySelector('.close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Buttons
        document.getElementById('add-pipeline')?.addEventListener('click', () => {
            this.showCreatePipelineModal();
        });

        document.getElementById('add-job')?.addEventListener('click', () => {
            this.showCreateJobModal();
        });

        document.getElementById('clear-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });

        // Settings form events
        document.getElementById('db-config-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDbConfig();
        });

        document.getElementById('test-connection')?.addEventListener('click', () => {
            this.testDbConnection();
        });

        document.getElementById('system-config-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemConfig();
        });

        document.getElementById('security-config-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSecurityConfig();
        });

        document.getElementById('generate-api-key')?.addEventListener('click', () => {
            this.generateApiKey();
        });

        document.getElementById('reset-settings')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Database type change handler
        document.getElementById('db-type')?.addEventListener('change', (e) => {
            this.updateDbPortDefault(e.target.value);
        });

        // Window click to close modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal();
            }
        });
    }

    navigateToSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

        // Update sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName)?.classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'pipelines':
                this.loadPipelines();
                break;
            case 'jobs':
                this.loadJobs();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Settings Methods
    loadSettings() {
        // Load saved settings from localStorage or API
        const savedSettings = localStorage.getItem('aiopsci-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.populateSettingsForm(settings);
        }
    }

    populateSettingsForm(settings) {
        if (settings.database) {
            document.getElementById('db-type').value = settings.database.type || 'postgresql';
            document.getElementById('db-host').value = settings.database.host || 'localhost';
            document.getElementById('db-port').value = settings.database.port || '5432';
            document.getElementById('db-name').value = settings.database.name || 'aiopsci';
            document.getElementById('db-username').value = settings.database.username || '';
            document.getElementById('db-connection-string').value = settings.database.connectionString || '';
        }

        if (settings.system) {
            document.getElementById('max-concurrent-jobs').value = settings.system.maxConcurrentJobs || 5;
            document.getElementById('log-retention-days').value = settings.system.logRetentionDays || 30;
            document.getElementById('polling-interval').value = settings.system.pollingInterval || 5;
            document.getElementById('enable-notifications').checked = settings.system.enableNotifications !== false;
            document.getElementById('auto-restart-failed').checked = settings.system.autoRestartFailed || false;
        }

        if (settings.security) {
            document.getElementById('session-timeout').value = settings.security.sessionTimeout || 60;
            document.getElementById('enable-ssl').checked = settings.security.enableSSL !== false;
        }
    }

    updateDbPortDefault(dbType) {
        const portDefaults = {
            'postgresql': '5432',
            'mysql': '3306',
            'sqlite': '',
            'mongodb': '27017'
        };
        
        const portField = document.getElementById('db-port');
        if (portField && portDefaults[dbType] !== undefined) {
            portField.value = portDefaults[dbType];
        }
    }

    async testDbConnection() {
        const button = document.getElementById('test-connection');
        const config = this.getDbConfigFromForm();
        
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        
        // Remove existing result
        const existingResult = document.querySelector('.connection-result');
        if (existingResult) {
            existingResult.remove();
        }

        try {
            const response = await fetch('/api/database/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await response.json();
            this.showConnectionResult(result.success, result.message);
            
            if (result.success) {
                this.updateDbStatus('connected');
                this.addLog('Database connection test successful', 'info');
            } else {
                this.updateDbStatus('disconnected');
                this.addLog(`Database connection test failed: ${result.message}`, 'error');
            }
        } catch (error) {
            this.showConnectionResult(false, `Connection failed: ${error.message}`);
            this.updateDbStatus('disconnected');
            this.addLog(`Database connection test error: ${error.message}`, 'error');
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showConnectionResult(success, message) {
        const form = document.getElementById('db-config-form');
        const resultDiv = document.createElement('div');
        resultDiv.className = `connection-result ${success ? 'success' : 'error'}`;
        resultDiv.textContent = message;
        form.appendChild(resultDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.remove();
            }
        }, 5000);
    }

    getDbConfigFromForm() {
        return {
            type: document.getElementById('db-type').value,
            host: document.getElementById('db-host').value,
            port: document.getElementById('db-port').value,
            name: document.getElementById('db-name').value,
            username: document.getElementById('db-username').value,
            password: document.getElementById('db-password').value,
            connectionString: document.getElementById('db-connection-string').value
        };
    }

    async saveDbConfig() {
        const config = this.getDbConfigFromForm();
        
        try {
            const response = await fetch('/api/database/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.addLog('Database configuration saved successfully', 'info');
                this.saveSettingsToStorage('database', config);
                this.updateDbStatus('connected');
            } else {
                throw new Error('Failed to save database configuration');
            }
        } catch (error) {
            this.addLog(`Error saving database config: ${error.message}`, 'error');
        }
    }

    async saveSystemConfig() {
        const config = {
            maxConcurrentJobs: parseInt(document.getElementById('max-concurrent-jobs').value),
            logRetentionDays: parseInt(document.getElementById('log-retention-days').value),
            pollingInterval: parseInt(document.getElementById('polling-interval').value),
            enableNotifications: document.getElementById('enable-notifications').checked,
            autoRestartFailed: document.getElementById('auto-restart-failed').checked
        };

        try {
            const response = await fetch('/api/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.addLog('System configuration saved successfully', 'info');
                this.saveSettingsToStorage('system', config);
            } else {
                throw new Error('Failed to save system configuration');
            }
        } catch (error) {
            this.addLog(`Error saving system config: ${error.message}`, 'error');
        }
    }

    async saveSecurityConfig() {
        const config = {
            apiKey: document.getElementById('api-key').value,
            sessionTimeout: parseInt(document.getElementById('session-timeout').value),
            enableSSL: document.getElementById('enable-ssl').checked
        };

        try {
            const response = await fetch('/api/security/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.addLog('Security configuration saved successfully', 'info');
                this.saveSettingsToStorage('security', config);
            } else {
                throw new Error('Failed to save security configuration');
            }
        } catch (error) {
            this.addLog(`Error saving security config: ${error.message}`, 'error');
        }
    }

    generateApiKey() {
        const apiKey = this.generateRandomKey(32);
        document.getElementById('api-key').value = apiKey;
        this.addLog('New API key generated', 'info');
    }

    generateRandomKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.removeItem('aiopsci-settings');
            this.populateSettingsForm({});
            this.addLog('Settings reset to defaults', 'info');
        }
    }

    saveSettingsToStorage(section, config) {
        const settings = JSON.parse(localStorage.getItem('aiopsci-settings') || '{}');
        settings[section] = config;
        localStorage.setItem('aiopsci-settings', JSON.stringify(settings));
    }

    updateDbStatus(status = 'disconnected') {
        this.dbConnection.status = status;
        
        const statusTexts = {
            'connected': 'DB CONNECTED',
            'disconnected': 'DB DISCONNECTED',
            'connecting': 'DB CONNECTING...'
        };

        const statusText = statusTexts[status] || 'DB UNKNOWN';
        
        // Update sidebar status
        const dbStatusDot = document.getElementById('db-status-dot');
        const dbStatusText = document.getElementById('db-status-text');
        
        if (dbStatusDot && dbStatusText) {
            dbStatusDot.className = `status-dot ${status}`;
            dbStatusText.textContent = statusText;
        }

        // Update settings page status
        const settingsDbDot = document.getElementById('settings-db-dot');
        const settingsDbStatus = document.getElementById('settings-db-status');
        
        if (settingsDbDot && settingsDbStatus) {
            settingsDbDot.className = `status-dot ${status}`;
            settingsDbStatus.textContent = statusText;
        }

        // Update dashboard
        const dbStatusDashboard = document.getElementById('db-status-dashboard');
        if (dbStatusDashboard) {
            dbStatusDashboard.textContent = status.toUpperCase();
            dbStatusDashboard.className = `card-value ${status}`;
        }
    }

    // Existing methods remain the same...
    showModal(content) {
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showCreatePipelineModal() {
        const content = `
            <h3>Create New Pipeline</h3>
            <form id="pipeline-form">
                <div class="form-group">
                    <label for="pipeline-id">Pipeline ID:</label>
                    <input type="text" id="pipeline-id" required>
                </div>
                <div class="form-group">
                    <label for="pipeline-name">Pipeline Name:</label>
                    <input type="text" id="pipeline-name" required>
                </div>
                <div class="form-group">
                    <label for="pipeline-description">Description:</label>
                    <textarea id="pipeline-description"></textarea>
                </div>
                <button type="submit" class="cyber-btn primary">Create Pipeline</button>
            </form>
        `;
        this.showModal(content);

        document.getElementById('pipeline-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPipeline();
        });
    }

    showCreateJobModal() {
        const pipelineOptions = Object.keys(this.pipelines).map(id => 
            `<option value="${id}">${id}</option>`
        ).join('');

        const content = `
            <h3>Create New Job</h3>
            <form id="job-form">
                <div class="form-group">
                    <label for="job-name">Job Name:</label>
                    <input type="text" id="job-name" required>
                </div>
                <div class="form-group">
                    <label for="job-pipeline">Pipeline:</label>
                    <select id="job-pipeline" required>
                        <option value="">Select Pipeline</option>
                        ${pipelineOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="job-commands">Commands (one per line):</label>
                    <textarea id="job-commands" placeholder="echo 'Hello World'&#10;npm test&#10;npm run build"></textarea>
                </div>
                <button type="submit" class="cyber-btn primary">Create Job</button>
            </form>
        `;
        this.showModal(content);

        document.getElementById('job-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createJob();
        });
    }

    async createPipeline() {
        const id = document.getElementById('pipeline-id').value;
        const name = document.getElementById('pipeline-name').value;
        const description = document.getElementById('pipeline-description').value;

        try {
            const response = await fetch('/api/pipelines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, description })
            });

            if (response.ok) {
                this.pipelines[id] = { id, name, description };
                this.addLog(`Pipeline "${id}" created successfully`, 'info');
                this.closeModal();
                this.loadPipelines();
                this.loadDashboardData();
            }
        } catch (error) {
            this.addLog(`Error creating pipeline: ${error.message}`, 'error');
        }
    }

    async createJob() {
        const name = document.getElementById('job-name').value;
        const pipelineId = document.getElementById('job-pipeline').value;
        const commands = document.getElementById('job-commands').value.split('\n').filter(cmd => cmd.trim());

        try {
            const response = await fetch(`/api/pipelines/${pipelineId}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, commands })
            });

            if (response.ok) {
                this.jobs[name] = { name, status: 'pending', pipelineId };
                this.addLog(`Job "${name}" created successfully`, 'info');
                this.closeModal();
                this.loadJobs();
                this.loadDashboardData();
            }
        } catch (error) {
            this.addLog(`Error creating job: ${error.message}`, 'error');
        }
    }

    async runPipeline(pipelineId) {
        try {
            const response = await fetch(`/api/pipelines/${pipelineId}/run`, {
                method: 'POST'
            });

            if (response.ok) {
                this.addLog(`Pipeline "${pipelineId}" started`, 'info');
                this.loadDashboardData();
            }
        } catch (error) {
            this.addLog(`Error running pipeline: ${error.message}`, 'error');
        }
    }

    loadDashboardData() {
        document.getElementById('total-pipelines').textContent = Object.keys(this.pipelines).length;
        document.getElementById('running-jobs').textContent = 
            Object.values(this.jobs).filter(job => job.status === 'running').length;
        
        // Load recent activity
        const activityList = document.getElementById('activity-list');
        const recentLogs = this.logs.slice(-5).reverse();
        activityList.innerHTML = recentLogs.map(log => 
            `<div class="activity-item">${log.timestamp} - ${log.message}</div>`
        ).join('');
    }

    loadPipelines() {
        const pipelineList = document.getElementById('pipeline-list');
        pipelineList.innerHTML = Object.values(this.pipelines).map(pipeline => `
            <div class="pipeline-item">
                <h3>${pipeline.id}</h3>
                <p>${pipeline.name || ''}</p>
                <div class="pipeline-actions">
                    <button class="cyber-btn success" onclick="app.runPipeline('${pipeline.id}')">Run</button>
                    <button class="cyber-btn secondary">Configure</button>
                    <button class="cyber-btn danger">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadJobs() {
        const jobList = document.getElementById('job-list');
        jobList.innerHTML = Object.values(this.jobs).map(job => `
            <div class="job-item">
                <h3>${job.name}</h3>
                <span class="status ${job.status}">${job.status}</span>
                <div class="job-actions">
                    <button class="cyber-btn secondary">View Details</button>
                    <button class="cyber-btn danger">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadLogs() {
        const logOutput = document.getElementById('log-output');
        logOutput.textContent = this.logs.map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');
    }

    addLog(message, level = 'info') {
        const log = {
            timestamp: new Date().toISOString(),
            message,
            level
        };
        this.logs.push(log);

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        // Update logs if currently viewing
        if (this.currentSection === 'logs') {
            this.loadLogs();
        }
    }

    clearLogs() {
        this.logs = [];
        this.loadLogs();
    }

    startPolling() {
        // Poll for updates every 5 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new CIToolApp();
});