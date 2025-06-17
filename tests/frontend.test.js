/**
 * Frontend API Client Tests
 * 
 * Comprehensive test suite for the frontend API client functions
 */

// Mock fetch globally for testing
global.fetch = jest.fn();

// Import the API functions
const {
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
} = require('../frontend/utils/api.js');

describe('Frontend API Client', () => {
    
    beforeEach(() => {
        // Clear all mocks before each test
        fetch.mockClear();
    });

    describe('API Configuration', () => {
        test('should have correct API base URL', () => {
            expect(API_BASE_URL).toBeDefined();
            expect(typeof API_BASE_URL).toBe('string');
        });
    });

    describe('APIError Class', () => {
        test('should create APIError with correct properties', () => {
            const error = new APIError('Test error', 400, { test: 'data' });
            expect(error.name).toBe('APIError');
            expect(error.message).toBe('Test error');
            expect(error.status).toBe(400);
            expect(error.data).toEqual({ test: 'data' });
        });
    });

    describe('checkHealth', () => {
        test('should fetch health status successfully', async () => {
            const mockResponse = {
                status: 'healthy',
                service: 'CO2-GDP Visualization API',
                version: '1.0.0'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await checkHealth();
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/`,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('fetchCountries', () => {
        test('should fetch countries list successfully', async () => {
            const mockResponse = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' }
                ],
                count: 2
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchCountries();
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/countries`,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('fetchData', () => {
        test('should fetch data without parameters', async () => {
            const mockResponse = {
                data: [
                    { country_code: 'USA', year: 2020, co2_per_capita: 15.5, gdp_per_capita: 63543 }
                ],
                metadata: { total_records: 1 }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchData();
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data`,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse);
        });

        test('should fetch data with string countries parameter', async () => {
            const mockResponse = { data: [], metadata: {} };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await fetchData({ countries: 'USA,CHN' });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data?countries=USA%2CCHN`,
                expect.any(Object)
            );
        });

        test('should fetch data with array countries parameter', async () => {
            const mockResponse = { data: [], metadata: {} };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await fetchData({ countries: ['USA', 'CHN'] });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data?countries=USA%2CCHN`,
                expect.any(Object)
            );
        });

        test('should fetch data with year parameters', async () => {
            const mockResponse = { data: [], metadata: {} };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await fetchData({ startYear: 2000, endYear: 2020 });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data?start_year=2000&end_year=2020`,
                expect.any(Object)
            );
        });

        test('should fetch data with all parameters', async () => {
            const mockResponse = { data: [], metadata: {} };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await fetchData({ 
                countries: ['USA'], 
                startYear: 2000, 
                endYear: 2020 
            });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data?countries=USA&start_year=2000&end_year=2020`,
                expect.any(Object)
            );
        });
    });

    describe('fetchCO2Data', () => {
        test('should fetch CO2 data successfully', async () => {
            const mockResponse = {
                data: [
                    { country_code: 'USA', year: 2020, co2_per_capita: 15.5 }
                ],
                metadata: { indicator: { code: 'EN.ATM.CO2E.PC' } }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchCO2Data({ countries: 'USA' });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data/co2?countries=USA`,
                expect.any(Object)
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('fetchGDPData', () => {
        test('should fetch GDP data successfully', async () => {
            const mockResponse = {
                data: [
                    { country_code: 'USA', year: 2020, gdp_per_capita: 63543 }
                ],
                metadata: { indicator: { code: 'NY.GDP.PCAP.CD' } }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchGDPData({ countries: 'USA' });
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/data/gdp?countries=USA`,
                expect.any(Object)
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('fetchIndicators', () => {
        test('should fetch indicators information successfully', async () => {
            const mockResponse = {
                indicators: {
                    co2: { code: 'EN.ATM.CO2E.PC', name: 'CO2 emissions' },
                    gdp: { code: 'NY.GDP.PCAP.CD', name: 'GDP per capita' }
                },
                count: 2
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchIndicators();
            expect(fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/indicators`,
                expect.any(Object)
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Error Handling', () => {
        test('should handle HTTP errors correctly', async () => {
            const mockErrorResponse = {
                error: 'Bad Request',
                message: 'Invalid parameters'
            };

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => mockErrorResponse
            });

            await expect(checkHealth()).rejects.toThrow(APIError);
            
            // Reset the mock for the second call
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => mockErrorResponse
            });
            
            await expect(checkHealth()).rejects.toThrow('Invalid parameters');
        });

        test('should handle network errors correctly', async () => {
            fetch.mockRejectedValueOnce(new Error('Network failure'));

            await expect(checkHealth()).rejects.toThrow(APIError);
            await expect(checkHealth()).rejects.toThrow('Network error');
        });
    });

    describe('Validation Functions', () => {
        describe('validateYears', () => {
            test('should validate correct years', () => {
                expect(() => validateYears(2000, 2020)).not.toThrow();
                expect(() => validateYears(1990)).not.toThrow();
            });

            test('should reject invalid start year', () => {
                expect(() => validateYears(1950)).toThrow('Start year must be between');
                expect(() => validateYears(2030)).toThrow('Start year must be between');
            });

            test('should reject invalid end year', () => {
                expect(() => validateYears(2000, 1990)).toThrow('End year must be between');
                expect(() => validateYears(2000, 2030)).toThrow('End year must be between');
            });
        });

        describe('validateCountries', () => {
            test('should validate correct country codes', () => {
                expect(() => validateCountries('USA')).not.toThrow();
                expect(() => validateCountries(['USA', 'CHN'])).not.toThrow();
                expect(() => validateCountries('USA,CHN,GBR')).not.toThrow();
            });

            test('should reject invalid country codes', () => {
                expect(() => validateCountries('US')).toThrow('Invalid country codes');
                expect(() => validateCountries(['USA', 'CN'])).toThrow('Invalid country codes');
                expect(() => validateCountries('')).toThrow('Invalid country codes');
            });

            test('should handle null/undefined countries', () => {
                expect(() => validateCountries(null)).not.toThrow();
                expect(() => validateCountries(undefined)).not.toThrow();
            });
        });
    });

    describe('fetchValidatedData', () => {
        test('should fetch data with validation', async () => {
            const mockResponse = {
                data: [
                    { country_code: 'USA', year: 2020, co2_per_capita: 15.5, gdp_per_capita: 63543 }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchValidatedData({ 
                countries: 'USA', 
                startYear: 2000, 
                endYear: 2020 
            });
            expect(result).toEqual(mockResponse);
        });

        test('should reject invalid parameters', async () => {
            await expect(fetchValidatedData({ 
                startYear: 1950 
            })).rejects.toThrow('Start year must be between');

            await expect(fetchValidatedData({ 
                countries: 'US' 
            })).rejects.toThrow('Invalid country codes');
        });

        test('should reject invalid response format', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => null
            });

            await expect(fetchValidatedData()).rejects.toThrow('Invalid response format');
        });
    });
});