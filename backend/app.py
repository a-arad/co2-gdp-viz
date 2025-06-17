"""
Flask API for CO2-GDP Visualization Backend

This module provides RESTful API endpoints for serving World Bank data
including CO2 emissions and GDP per capita data with proper CORS configuration.
"""

import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Dict, List, Optional
from datetime import datetime

from data_fetcher import WorldBankDataFetcher, get_countries, get_co2_gdp_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS for frontend integration
CORS(app, origins=["*"])

# Initialize data fetcher
data_fetcher = WorldBankDataFetcher()


@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors."""
    return jsonify({
        'error': 'Bad Request',
        'message': 'Invalid request parameters'
    }), 400


@app.errorhandler(404)
def not_found(error):
    """Handle not found errors."""
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An internal server error occurred'
    }), 500


@app.route('/', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    
    Returns:
        JSON response indicating API status
    """
    return jsonify({
        'status': 'healthy',
        'service': 'CO2-GDP Visualization API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/countries', methods=['GET'])
def get_countries_endpoint():
    """
    Get list of available countries.
    
    Returns:
        JSON response with list of countries
    """
    try:
        logger.info("Fetching countries list")
        countries = get_countries()
        
        return jsonify({
            'countries': countries,
            'count': len(countries),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching countries: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch countries',
            'message': str(e)
        }), 500


@app.route('/api/data', methods=['GET'])
def get_data_endpoint():
    """
    Get CO2 emissions and GDP per capita data.
    
    Query Parameters:
        countries (optional): Comma-separated list of country codes
        start_year (optional): Starting year (default: 1990)
        end_year (optional): Ending year (default: current year)
    
    Returns:
        JSON response with combined CO2 and GDP data
    """
    try:
        # Parse query parameters
        countries_param = request.args.get('countries')
        start_year = request.args.get('start_year', 1990, type=int)
        end_year = request.args.get('end_year', type=int)
        
        # Validate parameters
        if start_year < 1960 or start_year > datetime.now().year:
            return jsonify({
                'error': 'Invalid start_year',
                'message': 'start_year must be between 1960 and current year'
            }), 400
            
        if end_year and (end_year < start_year or end_year > datetime.now().year):
            return jsonify({
                'error': 'Invalid end_year',
                'message': 'end_year must be >= start_year and <= current year'
            }), 400
        
        # Parse countries list
        countries = None
        if countries_param:
            countries = [c.strip().upper() for c in countries_param.split(',') if c.strip()]
            if not countries:
                countries = None
        
        logger.info(f"Fetching data for countries: {countries}, years: {start_year}-{end_year}")
        
        # Fetch data
        data = get_co2_gdp_data(countries, start_year, end_year)
        
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch data',
            'message': str(e)
        }), 500


@app.route('/api/data/co2', methods=['GET'])
def get_co2_data_endpoint():
    """
    Get CO2 emissions data only.
    
    Query Parameters:
        countries (optional): Comma-separated list of country codes
        start_year (optional): Starting year (default: 1990)
        end_year (optional): Ending year (default: current year)
    
    Returns:
        JSON response with CO2 emissions data
    """
    try:
        # Parse query parameters
        countries_param = request.args.get('countries')
        start_year = request.args.get('start_year', 1990, type=int)
        end_year = request.args.get('end_year', type=int)
        
        # Validate parameters
        if start_year < 1960 or start_year > datetime.now().year:
            return jsonify({
                'error': 'Invalid start_year',
                'message': 'start_year must be between 1960 and current year'
            }), 400
            
        if end_year and (end_year < start_year or end_year > datetime.now().year):
            return jsonify({
                'error': 'Invalid end_year',
                'message': 'end_year must be >= start_year and <= current year'
            }), 400
        
        # Parse countries list
        countries = None
        if countries_param:
            countries = [c.strip().upper() for c in countries_param.split(',') if c.strip()]
            if not countries:
                countries = None
        
        logger.info(f"Fetching CO2 data for countries: {countries}, years: {start_year}-{end_year}")
        
        # Fetch CO2 data
        co2_data = data_fetcher.fetch_co2_data(countries, start_year, end_year)
        
        # Format response
        data_records = co2_data.to_dict('records') if not co2_data.empty else []
        
        response = {
            'data': data_records,
            'metadata': {
                'total_records': len(data_records),
                'countries': co2_data['country_code'].nunique() if not co2_data.empty else 0,
                'years': f"{start_year}-{end_year or datetime.now().year}",
                'indicator': {
                    'code': data_fetcher.CO2_INDICATOR,
                    'name': 'CO2 emissions (metric tons per capita)'
                },
                'last_updated': datetime.now().isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error fetching CO2 data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch CO2 data',
            'message': str(e)
        }), 500


@app.route('/api/data/gdp', methods=['GET'])
def get_gdp_data_endpoint():
    """
    Get GDP per capita data only.
    
    Query Parameters:
        countries (optional): Comma-separated list of country codes
        start_year (optional): Starting year (default: 1990)
        end_year (optional): Ending year (default: current year)
    
    Returns:
        JSON response with GDP per capita data
    """
    try:
        # Parse query parameters
        countries_param = request.args.get('countries')
        start_year = request.args.get('start_year', 1990, type=int)
        end_year = request.args.get('end_year', type=int)
        
        # Validate parameters
        if start_year < 1960 or start_year > datetime.now().year:
            return jsonify({
                'error': 'Invalid start_year',
                'message': 'start_year must be between 1960 and current year'
            }), 400
            
        if end_year and (end_year < start_year or end_year > datetime.now().year):
            return jsonify({
                'error': 'Invalid end_year',
                'message': 'end_year must be >= start_year and <= current year'
            }), 400
        
        # Parse countries list
        countries = None
        if countries_param:
            countries = [c.strip().upper() for c in countries_param.split(',') if c.strip()]
            if not countries:
                countries = None
        
        logger.info(f"Fetching GDP data for countries: {countries}, years: {start_year}-{end_year}")
        
        # Fetch GDP data
        gdp_data = data_fetcher.fetch_gdp_data(countries, start_year, end_year)
        
        # Format response
        data_records = gdp_data.to_dict('records') if not gdp_data.empty else []
        
        response = {
            'data': data_records,
            'metadata': {
                'total_records': len(data_records),
                'countries': gdp_data['country_code'].nunique() if not gdp_data.empty else 0,
                'years': f"{start_year}-{end_year or datetime.now().year}",
                'indicator': {
                    'code': data_fetcher.GDP_INDICATOR,
                    'name': 'GDP per capita (current US$)'
                },
                'last_updated': datetime.now().isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error fetching GDP data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch GDP data',
            'message': str(e)
        }), 500


@app.route('/api/indicators', methods=['GET'])
def get_indicators_endpoint():
    """
    Get information about available indicators.
    
    Returns:
        JSON response with indicator information
    """
    try:
        indicators = {
            'co2': {
                'code': data_fetcher.CO2_INDICATOR,
                'name': 'CO2 emissions (metric tons per capita)',
                'unit': 'metric tons per capita',
                'source': 'World Bank'
            },
            'gdp': {
                'code': data_fetcher.GDP_INDICATOR,
                'name': 'GDP per capita (current US$)',
                'unit': 'current US$',
                'source': 'World Bank'
            }
        }
        
        return jsonify({
            'indicators': indicators,
            'count': len(indicators),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching indicators: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch indicators',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    # Run the Flask development server
    app.run(debug=True, host='0.0.0.0', port=5000)