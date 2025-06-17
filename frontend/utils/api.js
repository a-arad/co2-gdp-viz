/**
 * Frontend API Client for CO2-GDP Visualization
 * 
 * This module provides functions to interact with the Flask backend API,
 * including data fetching with proper error handling and response validation.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Custom error class for API-related errors
 */
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Generic API request function with error handling
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.message || `HTTP ${response.status} - ${response.statusText}`,
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        
        // Handle network errors
        throw new APIError(
            `Network error: ${error.message}`,
            0,
            { originalError: error.message }
        );
    }
}

/**
 * Check API health status
 * @returns {Promise<Object>} - Health check response
 */
async function checkHealth() {
    return await apiRequest('/');
}

/**
 * Fetch list of available countries
 * @returns {Promise<Object>} - Countries data with metadata
 */
async function fetchCountries() {
    return await apiRequest('/api/countries');
}

/**
 * Fetch combined CO2 and GDP data
 * @param {Object} params - Query parameters
 * @param {string|Array} params.countries - Country codes (comma-separated string or array)
 * @param {number} params.startYear - Starting year (default: 1990)
 * @param {number} params.endYear - Ending year (optional)
 * @returns {Promise<Object>} - Combined CO2 and GDP data
 */
async function fetchData(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.countries) {
        const countriesString = Array.isArray(params.countries) 
            ? params.countries.join(',')
            : params.countries;
        queryParams.append('countries', countriesString);
    }
    
    if (params.startYear) {
        queryParams.append('start_year', params.startYear.toString());
    }
    
    if (params.endYear) {
        queryParams.append('end_year', params.endYear.toString());
    }
    
    const query = queryParams.toString();
    const endpoint = `/api/data${query ? `?${query}` : ''}`;
    
    return await apiRequest(endpoint);
}

/**
 * Fetch CO2 emissions data only
 * @param {Object} params - Query parameters
 * @param {string|Array} params.countries - Country codes (comma-separated string or array)
 * @param {number} params.startYear - Starting year (default: 1990)
 * @param {number} params.endYear - Ending year (optional)
 * @returns {Promise<Object>} - CO2 emissions data
 */
async function fetchCO2Data(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.countries) {
        const countriesString = Array.isArray(params.countries) 
            ? params.countries.join(',')
            : params.countries;
        queryParams.append('countries', countriesString);
    }
    
    if (params.startYear) {
        queryParams.append('start_year', params.startYear.toString());
    }
    
    if (params.endYear) {
        queryParams.append('end_year', params.endYear.toString());
    }
    
    const query = queryParams.toString();
    const endpoint = `/api/data/co2${query ? `?${query}` : ''}`;
    
    return await apiRequest(endpoint);
}

/**
 * Fetch GDP per capita data only
 * @param {Object} params - Query parameters
 * @param {string|Array} params.countries - Country codes (comma-separated string or array)
 * @param {number} params.startYear - Starting year (default: 1990)
 * @param {number} params.endYear - Ending year (optional)
 * @returns {Promise<Object>} - GDP per capita data
 */
async function fetchGDPData(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.countries) {
        const countriesString = Array.isArray(params.countries) 
            ? params.countries.join(',')
            : params.countries;
        queryParams.append('countries', countriesString);
    }
    
    if (params.startYear) {
        queryParams.append('start_year', params.startYear.toString());
    }
    
    if (params.endYear) {
        queryParams.append('end_year', params.endYear.toString());
    }
    
    const query = queryParams.toString();
    const endpoint = `/api/data/gdp${query ? `?${query}` : ''}`;
    
    return await apiRequest(endpoint);
}

/**
 * Fetch information about available indicators
 * @returns {Promise<Object>} - Indicators information
 */
async function fetchIndicators() {
    return await apiRequest('/api/indicators');
}

/**
 * Utility function to validate year parameters
 * @param {number} startYear - Starting year
 * @param {number} endYear - Ending year (optional)
 * @throws {Error} - If years are invalid
 */
function validateYears(startYear, endYear = null) {
    const currentYear = new Date().getFullYear();
    
    if (startYear < 1960 || startYear > currentYear) {
        throw new Error(`Start year must be between 1960 and ${currentYear}`);
    }
    
    if (endYear && (endYear < startYear || endYear > currentYear)) {
        throw new Error(`End year must be between ${startYear} and ${currentYear}`);
    }
}

/**
 * Utility function to validate country codes
 * @param {string|Array} countries - Country codes
 * @throws {Error} - If country codes are invalid
 */
function validateCountries(countries) {
    if (countries === null || countries === undefined) return;
    
    // Handle empty string case
    if (countries === '') {
        throw new Error('Invalid country codes: (empty). Country codes must be 3-letter ISO codes.');
    }
    
    const countryArray = Array.isArray(countries) ? countries : countries.split(',');
    const invalidCodes = countryArray.filter(code => 
        !code || typeof code !== 'string' || code.trim().length !== 3
    );
    
    if (invalidCodes.length > 0) {
        const invalidCodesStr = invalidCodes.map(code => code || '(empty)').join(', ');
        throw new Error(`Invalid country codes: ${invalidCodesStr}. Country codes must be 3-letter ISO codes.`);
    }
}

/**
 * Higher-level function to fetch data with validation
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Validated data response
 */
async function fetchValidatedData(params = {}) {
    try {
        // Validate parameters
        if (params.startYear || params.endYear) {
            validateYears(params.startYear, params.endYear);
        }
        
        if (params.countries) {
            validateCountries(params.countries);
        }
        
        // Fetch data
        const data = await fetchData(params);
        
        // Additional validation on response
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from API');
        }
        
        return data;
        
    } catch (error) {
        console.error('Error fetching validated data:', error);
        throw error;
    }
}

// Export all functions for use in components and tests
module.exports = {
    checkHealth,
    fetchCountries,
    fetchData,
    fetchCO2Data,
    fetchGDPData,
    fetchIndicators,
    fetchValidatedData,
    validateYears,
    validateCountries,
    APIError,
    API_BASE_URL
};