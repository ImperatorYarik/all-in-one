document.addEventListener('DOMContentLoaded', function() {
    const addPipelineBtn = document.getElementById('add-pipeline');
    const addJobBtn = document.getElementById('add-job');
    const pipelineList = document.getElementById('pipeline-list');
    const jobList = document.getElementById('job-list');

    // Add Pipeline functionality
    addPipelineBtn.addEventListener('click', function() {
        const pipelineId = prompt('Enter pipeline ID:');
        if (pipelineId) {
            createPipeline(pipelineId);
        }
    });

    // Add Job functionality
    addJobBtn.addEventListener('click', function() {
        const jobName = prompt('Enter job name:');
        const pipelineId = prompt('Enter pipeline ID:');
        if (jobName && pipelineId) {
            createJob(jobName, pipelineId);
        }
    });

    async function createPipeline(pipelineId) {
        try {
            const response = await fetch('/api/pipelines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: pipelineId })
            });
            
            if (response.ok) {
                const result = await response.json();
                addPipelineToDOM(pipelineId);
                alert('Pipeline created successfully!');
            }
        } catch (error) {
            console.error('Error creating pipeline:', error);
            alert('Error creating pipeline');
        }
    }

    async function createJob(jobName, pipelineId) {
        try {
            const response = await fetch(`/api/pipelines/${pipelineId}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: jobName })
            });
            
            if (response.ok) {
                const result = await response.json();
                addJobToDOM(jobName);
                alert('Job created successfully!');
            }
        } catch (error) {
            console.error('Error creating job:', error);
            alert('Error creating job');
        }
    }

    function addPipelineToDOM(pipelineId) {
        const pipelineElement = document.createElement('div');
        pipelineElement.className = 'pipeline-item';
        pipelineElement.innerHTML = `
            <h3>${pipelineId}</h3>
            <button onclick="runPipeline('${pipelineId}')">Run</button>
        `;
        pipelineList.appendChild(pipelineElement);
    }

    function addJobToDOM(jobName) {
        const jobElement = document.createElement('div');
        jobElement.className = 'job-item';
        jobElement.innerHTML = `
            <h3>${jobName}</h3>
            <span class="status">Pending</span>
        `;
        jobList.appendChild(jobElement);
    }

    // Global function for running pipelines
    window.runPipeline = async function(pipelineId) {
        try {
            const response = await fetch(`/api/pipelines/${pipelineId}/run`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert(`Pipeline ${pipelineId} is running!`);
            }
        } catch (error) {
            console.error('Error running pipeline:', error);
            alert('Error running pipeline');
        }
    };
});