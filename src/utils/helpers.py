def format_duration(seconds):
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours}h {minutes}m {seconds}s"

def log_message(message):
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def validate_job_name(name):
    if not name or not isinstance(name, str):
        raise ValueError("Job name must be a non-empty string.")
    if len(name) > 100:
        raise ValueError("Job name must not exceed 100 characters.")
    return True

def read_config_file(file_path):
    import json
    with open(file_path, 'r') as file:
        return json.load(file)