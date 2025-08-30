class Job:
    def __init__(self, name):
        self.name = name
        self.status = 'pending'

    def execute(self):
        # Logic to execute the job
        self.status = 'running'
        # Simulate job execution
        self.status = 'completed'