import os


DATABASE_URL = os.getenv("DATABASE_URL", None)
API_KEY = os.getenv("API_KEY", "your_api_key_here")
DEBUG = os.getenv("DEBUG", True)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
APP_VERSION = os.getenv("APP_VERSION", "0.0.0")