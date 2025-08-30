import unittest
from src.core.pipeline import Pipeline
from src.core.job import Job

class TestPipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = Pipeline()
        self.job1 = Job(name="Job 1")
        self.job2 = Job(name="Job 2")

    def test_add_job(self):
        self.pipeline.add_job(self.job1)
        self.assertIn(self.job1, self.pipeline.jobs)

    def test_run_pipeline(self):
        self.pipeline.add_job(self.job1)
        self.pipeline.add_job(self.job2)
        self.pipeline.run()
        self.assertEqual(self.job1.status, 'completed')
        self.assertEqual(self.job2.status, 'completed')

    def test_pipeline_empty(self):
        self.pipeline.run()
        self.assertEqual(len(self.pipeline.jobs), 0)

if __name__ == '__main__':
    unittest.main()