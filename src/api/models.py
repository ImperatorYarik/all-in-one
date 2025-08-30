class JobModel:
    def __init__(self, name, status='pending'):
        self.name = name
        self.status = status

class PipelineModel:
    def __init__(self, name):
        self.name = name
        self.jobs = []

    def add_job(self, job):
        self.jobs.append(job)

    def get_jobs(self):
        return self.jobs