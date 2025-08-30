class CIToolApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.pipelines = {};
        this.jobs = {};
        this.logs = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
        this.startPolling();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToSection(e.target.dataset.section);
            });
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Buttons
        document.getElementById('add-pipeline').addEventListener('click', () => {
            this.showCreatePipelineModal();
        });

        document.getElementById('add-job').addEventListener('click', () => {
            this.showCreateJobModal();
        });

        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });

        // Window click to close modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    navigateToSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

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
        }
    }

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
                <button type="submit" class="btn-primary">Create Pipeline</button>
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
                <button type="submit" class="btn-primary">Create Job</button>
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
                    <button class="btn-success" onclick="app.runPipeline('${pipeline.id}')">Run</button>
                    <button class="btn-secondary">Configure</button>
                    <button class="btn-danger">Delete</button>
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
                    <button class="btn-secondary">View Details</button>
                    <button class="btn-danger">Delete</button>
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