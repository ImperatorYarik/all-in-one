from flask import Blueprint, request, jsonify
from ..core.pipeline import Pipeline
from ..core.job import Job

api = Blueprint('api', __name__)

pipelines = {}
jobs = {}

@api.route('/pipelines', methods=['POST'])
def create_pipeline():
    data = request.json
    pipeline_id = data.get('id')
    pipelines[pipeline_id] = Pipeline(pipeline_id)
    return jsonify({"message": "Pipeline created", "id": pipeline_id}), 201

@api.route('/pipelines/<pipeline_id>/jobs', methods=['POST'])
def add_job_to_pipeline(pipeline_id):
    data = request.json
    job_name = data.get('name')
    job = Job(job_name)
    pipelines[pipeline_id].add_job(job)
    jobs[job_name] = job
    return jsonify({"message": "Job added", "job": job_name}), 201

@api.route('/pipelines/<pipeline_id>/run', methods=['POST'])
def run_pipeline(pipeline_id):
    if pipeline_id in pipelines:
        pipelines[pipeline_id].run()
        return jsonify({"message": "Pipeline is running"}), 200
    return jsonify({"message": "Pipeline not found"}), 404

@api.route('/jobs/<job_name>', methods=['GET'])
def get_job_status(job_name):
    job = jobs.get(job_name)
    if job:
        return jsonify({"name": job.name, "status": job.status}), 200
    return jsonify({"message": "Job not found"}), 404