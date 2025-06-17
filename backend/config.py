"""
Configuration settings for the CO2-GDP Visualization Backend.

This module contains application-specific configurations including
API settings, data processing parameters, and environment variables.
"""

import os
from datetime import datetime

class Config:
    """Base configuration class."""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 'yes']
    
    # API settings
    API_VERSION = '1.0.0'
    API_TITLE = 'CO2-GDP Visualization API'
    
    # Data fetching settings
    DEFAULT_START_YEAR = 1990
    DEFAULT_END_YEAR = datetime.now().year
    MIN_YEAR = 1960
    MAX_YEAR = datetime.now().year
    
    # World Bank API settings
    WB_API_TIMEOUT = 30  # seconds
    WB_API_MAX_RETRIES = 3
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    
    # Cache settings
    CACHE_TIMEOUT = int(os.environ.get('CACHE_TIMEOUT', 3600))  # 1 hour default


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Ensure secret key is set in production
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    WB_API_TIMEOUT = 5  # Shorter timeout for tests


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment."""
    env = os.environ.get('FLASK_ENV', 'default')
    return config.get(env, config['default'])