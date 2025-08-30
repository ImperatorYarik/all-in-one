class Pipeline:
    def __init__(self):
        self.jobs = []

    def add_job(self, job):
        self.jobs.append(job)

    def run(self):
        for job in self.jobs:
            job.execute()