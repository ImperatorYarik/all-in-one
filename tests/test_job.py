from src.core.job import Job

def test_job_execution():
    job = Job(name="Test Job")
    job.execute()
    assert job.status == "completed"

def test_job_initialization():
    job = Job(name="Initial Job")
    assert job.name == "Initial Job"
    assert job.status == "pending"