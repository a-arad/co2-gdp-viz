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

/**
 * CountryDropdown Component Tests
 * 
 * Tests for the CountryDropdown multi-select component
 */

// Mock DOM environment for CountryDropdown tests
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000'
    }
});

describe('CountryDropdown Component', () => {
    let container;
    let CountryDropdown;
    
    beforeAll(async () => {
        // Import CountryDropdown component
        CountryDropdown = require('../frontend/components/CountryDropdown.js');
    });
    
    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.id = 'test-dropdown';
        document.body.appendChild(container);
        
        // Clear any existing fetch mocks
        fetch.mockClear();
    });
    
    afterEach(() => {
        // Clean up container
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Remove any added styles
        const styles = document.getElementById('country-dropdown-styles');
        if (styles) {
            styles.remove();
        }
    });
    
    describe('Component Initialization', () => {
        test('should initialize with correct container', () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            const dropdown = new CountryDropdown('test-dropdown');
            
            expect(dropdown.containerId).toBe('test-dropdown');
            expect(dropdown.container).toBe(container);
            expect(dropdown.selectedCountries).toEqual([]);
            expect(dropdown.isOpen).toBe(false);
        });
        
        test('should throw error for invalid container', () => {
            expect(() => {
                new CountryDropdown('non-existent-container');
            }).toThrow("Container with ID 'non-existent-container' not found");
        });
        
        test('should apply custom configuration options', () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            const options = {
                placeholder: 'Custom placeholder',
                maxHeight: '300px',
                searchPlaceholder: 'Custom search...',
                maxSelectedDisplay: 5,
                allowSelectAll: false
            };
            
            const dropdown = new CountryDropdown('test-dropdown', options);
            
            expect(dropdown.config.placeholder).toBe('Custom placeholder');
            expect(dropdown.config.maxHeight).toBe('300px');
            expect(dropdown.config.searchPlaceholder).toBe('Custom search...');
            expect(dropdown.config.maxSelectedDisplay).toBe(5);
            expect(dropdown.config.allowSelectAll).toBe(false);
        });
    });
    
    describe('Country Loading', () => {
        test('should load countries from API successfully', async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' },
                    { code: 'GBR', name: 'United Kingdom' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            const dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for countries to load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(dropdown.countries).toHaveLength(3);
            expect(dropdown.countries[0]).toEqual({ code: 'CHN', name: 'China' }); // Sorted by name
            expect(dropdown.filteredCountries).toHaveLength(3);
        });
        
        test('should handle API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            fetch.mockRejectedValueOnce(new Error('API Error'));
            
            const onError = jest.fn();
            const dropdown = new CountryDropdown('test-dropdown', { onError });
            
            // Wait for error handling
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(consoleSpy).toHaveBeenCalledWith('Error loading countries:', expect.any(Error));
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
            
            consoleSpy.mockRestore();
        });
        
        test('should handle invalid response format', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ invalid: 'format' })
            });
            
            const dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for error handling
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(consoleSpy).toHaveBeenCalledWith('Error loading countries:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('Selection Management', () => {
        let dropdown;
        
        beforeEach(async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' },
                    { code: 'GBR', name: 'United Kingdom' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for countries to load
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        test('should toggle country selection', () => {
            const onSelectionChange = jest.fn();
            dropdown.onSelectionChange = onSelectionChange;
            
            // Select country
            dropdown.toggleCountrySelection('USA');
            expect(dropdown.selectedCountries).toContain('USA');
            expect(onSelectionChange).toHaveBeenCalledWith(
                ['USA'],
                [{ code: 'USA', name: 'United States' }]
            );
            
            // Deselect country
            dropdown.toggleCountrySelection('USA');
            expect(dropdown.selectedCountries).not.toContain('USA');
            expect(onSelectionChange).toHaveBeenCalledWith([], []);
        });
        
        test('should set selected countries programmatically', () => {
            dropdown.setSelectedCountries(['USA', 'CHN']);
            expect(dropdown.selectedCountries).toEqual(['USA', 'CHN']);
        });
        
        test('should filter invalid country codes when setting selection', () => {
            dropdown.setSelectedCountries(['USA', 'INVALID', 'CHN']);
            expect(dropdown.selectedCountries).toEqual(['USA', 'CHN']);
        });
        
        test('should clear all selections', () => {
            dropdown.selectedCountries = ['USA', 'CHN'];
            dropdown.clearSelection();
            expect(dropdown.selectedCountries).toEqual([]);
        });
        
        test('should handle select all functionality', () => {
            dropdown.handleSelectAll(true);
            expect(dropdown.selectedCountries).toEqual(['CHN', 'GBR', 'USA']); // Sorted
            
            dropdown.handleSelectAll(false);
            expect(dropdown.selectedCountries).toEqual([]);
        });
        
        test('should remove individual country selection', () => {
            dropdown.selectedCountries = ['USA', 'CHN'];
            dropdown.removeCountrySelection('USA');
            expect(dropdown.selectedCountries).toEqual(['CHN']);
        });
    });
    
    describe('Search Functionality', () => {
        let dropdown;
        
        beforeEach(async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' },
                    { code: 'GBR', name: 'United Kingdom' },
                    { code: 'FRA', name: 'France' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for countries to load
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        test('should filter countries by name', () => {
            dropdown.handleSearch('united');
            expect(dropdown.filteredCountries).toHaveLength(2);
            expect(dropdown.filteredCountries[0].name).toBe('United Kingdom');
            expect(dropdown.filteredCountries[1].name).toBe('United States');
        });
        
        test('should filter countries by code', () => {
            dropdown.handleSearch('usa');
            expect(dropdown.filteredCountries).toHaveLength(1);
            expect(dropdown.filteredCountries[0].code).toBe('USA');
        });
        
        test('should handle empty search term', () => {
            dropdown.handleSearch('united');
            expect(dropdown.filteredCountries).toHaveLength(2);
            
            dropdown.handleSearch('');
            expect(dropdown.filteredCountries).toHaveLength(4);
        });
        
        test('should handle no results', () => {
            dropdown.handleSearch('nonexistent');
            expect(dropdown.filteredCountries).toHaveLength(0);
        });
        
        test('should clear search when closing dropdown', () => {
            dropdown.handleSearch('united');
            dropdown.clearSearch();
            
            expect(dropdown.searchTerm).toBe('');
            expect(dropdown.filteredCountries).toHaveLength(4);
        });
    });
    
    describe('Dropdown Behavior', () => {
        let dropdown;
        
        beforeEach(async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for countries to load
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        test('should toggle dropdown open/close', () => {
            expect(dropdown.isOpen).toBe(false);
            
            dropdown.toggleDropdown();
            expect(dropdown.isOpen).toBe(true);
            
            dropdown.toggleDropdown();
            expect(dropdown.isOpen).toBe(false);
        });
        
        test('should open dropdown', () => {
            dropdown.openDropdown();
            expect(dropdown.isOpen).toBe(true);
        });
        
        test('should close dropdown', () => {
            dropdown.isOpen = true;
            dropdown.closeDropdown();
            expect(dropdown.isOpen).toBe(false);
        });
        
        test('should check if dropdown is open', () => {
            expect(dropdown.isDropdownOpen()).toBe(false);
            dropdown.openDropdown();
            expect(dropdown.isDropdownOpen()).toBe(true);
        });
    });
    
    describe('Public API', () => {
        let dropdown;
        
        beforeEach(async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' },
                    { code: 'CHN', name: 'China' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for countries to load
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        test('should get selected countries', () => {
            dropdown.selectedCountries = ['USA'];
            const selected = dropdown.getSelectedCountries();
            expect(selected).toEqual(['USA']);
            expect(selected).not.toBe(dropdown.selectedCountries); // Should return copy
        });
        
        test('should get available countries', () => {
            const available = dropdown.getAvailableCountries();
            expect(available).toHaveLength(2);
            expect(available).not.toBe(dropdown.countries); // Should return copy
        });
        
        test('should refresh countries data', async () => {
            const newMockCountries = {
                countries: [
                    { code: 'FRA', name: 'France' },
                    { code: 'DEU', name: 'Germany' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => newMockCountries
            });
            
            await dropdown.refresh();
            
            expect(dropdown.countries).toHaveLength(2);
            expect(dropdown.countries[0].name).toBe('France');
        });
    });
    
    describe('Component Cleanup', () => {
        test('should destroy component and clean up', async () => {
            const mockCountries = {
                countries: [
                    { code: 'USA', name: 'United States' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCountries
            });
            
            const dropdown = new CountryDropdown('test-dropdown');
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify component exists
            expect(container.children.length).toBeGreaterThan(0);
            
            // Destroy component
            dropdown.destroy();
            
            // Verify cleanup
            expect(container.innerHTML).toBe('');
            expect(dropdown.countries).toEqual([]);
            expect(dropdown.selectedCountries).toEqual([]);
            expect(dropdown.isOpen).toBe(false);
        });
    });
});

/**
 * TimeControls Component Tests
 * 
 * Tests for the TimeControls animation component
 */

describe('TimeControls Component', () => {
    let container;
    let TimeControls;
    
    beforeAll(async () => {
        // Import TimeControls component
        TimeControls = require('../frontend/components/TimeControls.js');
    });
    
    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.id = 'test-time-controls';
        document.body.appendChild(container);
        
        // Clear any existing intervals
        jest.clearAllTimers();
        jest.useFakeTimers();
    });
    
    afterEach(() => {
        // Clean up container
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Restore real timers
        jest.useRealTimers();
    });

    describe('Component Initialization', () => {
        test('should initialize with correct container', () => {
            const controls = new TimeControls('test-time-controls');
            
            expect(controls.containerId).toBe('test-time-controls');
            expect(controls.container).toBe(container);
            expect(container.children.length).toBeGreaterThan(0);
            
            controls.destroy();
        });

        test('should throw error for invalid container', () => {
            expect(() => {
                new TimeControls('invalid-container');
            }).toThrow("Container with ID 'invalid-container' not found");
        });

        test('should apply custom configuration options', () => {
            const options = {
                startYear: 2000,
                endYear: 2010,
                currentYear: 2005,
                animationSpeed: 500,
                showYearDisplay: false,
                showSpeedControl: false
            };
            
            const controls = new TimeControls('test-time-controls', options);
            
            expect(controls.config.startYear).toBe(2000);
            expect(controls.config.endYear).toBe(2010);
            expect(controls.currentYear).toBe(2005);
            expect(controls.config.animationSpeed).toBe(500);
            expect(controls.config.showYearDisplay).toBe(false);
            expect(controls.config.showSpeedControl).toBe(false);
            
            controls.destroy();
        });
    });

    describe('Year Management', () => {
        test('should set current year correctly', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2010
            });
            
            let callbackYear = null;
            controls.onYearChange = (year) => { callbackYear = year; };
            
            controls.setYear(2005, true);
            
            expect(controls.getCurrentYear()).toBe(2005);
            expect(callbackYear).toBe(2005);
            
            controls.destroy();
        });

        test('should reject invalid years', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2010
            });
            
            const initialYear = controls.getCurrentYear();
            
            controls.setYear(1999); // Below range
            expect(controls.getCurrentYear()).toBe(initialYear);
            
            controls.setYear(2011); // Above range
            expect(controls.getCurrentYear()).toBe(initialYear);
            
            controls.destroy();
        });

        test('should update year range correctly', () => {
            const controls = new TimeControls('test-time-controls');
            
            controls.setYearRange(2005, 2015, 2010);
            
            expect(controls.config.startYear).toBe(2005);
            expect(controls.config.endYear).toBe(2015);
            expect(controls.getCurrentYear()).toBe(2010);
            expect(controls.getAvailableYears()).toEqual([2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015]);
            
            controls.destroy();
        });
    });

    describe('Animation Controls', () => {
        test('should toggle play/pause state', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2005
            });
            
            let playState = null;
            controls.onPlayStateChange = (playing) => { playState = playing; };
            
            expect(controls.isAnimationPlaying()).toBe(false);
            
            controls.play();
            expect(controls.isAnimationPlaying()).toBe(true);
            expect(playState).toBe(true);
            
            controls.pause();
            expect(controls.isAnimationPlaying()).toBe(false);
            expect(playState).toBe(false);
            
            controls.destroy();
        });

        test('should advance through years during animation', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2002,
                animationSpeed: 100
            });
            
            const yearChanges = [];
            controls.onYearChange = (year) => { yearChanges.push(year); };
            
            controls.setYear(2000);
            controls.play();
            
            // Advance fake timers
            jest.advanceTimersByTime(100);
            expect(controls.getCurrentYear()).toBe(2001);
            
            jest.advanceTimersByTime(100);
            expect(controls.getCurrentYear()).toBe(2002);
            
            jest.advanceTimersByTime(100);
            expect(controls.isAnimationPlaying()).toBe(false); // Should auto-stop at end
            
            controls.destroy();
        });

        test('should stop animation and reset to start', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2005
            });
            
            controls.setYear(2003);
            controls.play();
            
            controls.stop();
            
            expect(controls.isAnimationPlaying()).toBe(false);
            expect(controls.getCurrentYear()).toBe(2000);
            
            controls.destroy();
        });
    });

    describe('Speed Control', () => {
        test('should set animation speed', () => {
            const controls = new TimeControls('test-time-controls');
            
            let speedValue = null;
            controls.onSpeedChange = (speed) => { speedValue = speed; };
            
            controls.setSpeed(2);
            
            expect(controls.getCurrentSpeed()).toBe(2);
            expect(speedValue).toBe(2);
            
            controls.destroy();
        });

        test('should restart animation with new speed', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2005,
                animationSpeed: 100
            });
            
            controls.play();
            expect(controls.isAnimationPlaying()).toBe(true);
            
            controls.setSpeed(2);
            
            expect(controls.isAnimationPlaying()).toBe(true);
            expect(controls.getCurrentSpeed()).toBe(2);
            
            controls.destroy();
        });
    });

    describe('Public API', () => {
        test('should get current year', () => {
            const controls = new TimeControls('test-time-controls', {
                currentYear: 2005
            });
            
            expect(controls.getCurrentYear()).toBe(2005);
            
            controls.destroy();
        });

        test('should get available years', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2003
            });
            
            expect(controls.getAvailableYears()).toEqual([2000, 2001, 2002, 2003]);
            
            controls.destroy();
        });

        test('should check if animation is playing', () => {
            const controls = new TimeControls('test-time-controls');
            
            expect(controls.isAnimationPlaying()).toBe(false);
            
            controls.play();
            expect(controls.isAnimationPlaying()).toBe(true);
            
            controls.pause();
            expect(controls.isAnimationPlaying()).toBe(false);
            
            controls.destroy();
        });

        test('should get current speed', () => {
            const controls = new TimeControls('test-time-controls');
            
            expect(controls.getCurrentSpeed()).toBe(1);
            
            controls.setSpeed(1.5);
            expect(controls.getCurrentSpeed()).toBe(1.5);
            
            controls.destroy();
        });
    });

    describe('UI Interaction', () => {
        test('should enable/disable controls', () => {
            const controls = new TimeControls('test-time-controls');
            
            controls.setEnabled(false);
            expect(controls.controlsElement.style.opacity).toBe('0.5');
            
            controls.setEnabled(true);
            expect(controls.controlsElement.style.opacity).toBe('1');
            
            controls.destroy();
        });

        test('should update display elements', () => {
            const controls = new TimeControls('test-time-controls', {
                startYear: 2000,
                endYear: 2010,
                showYearDisplay: true
            });
            
            controls.setYear(2005);
            
            expect(controls.yearSlider.value).toBe('2005');
            expect(controls.yearDisplay.textContent).toBe('2005');
            
            controls.destroy();
        });
    });

    describe('Event Handling', () => {
        test('should handle year change events', () => {
            const controls = new TimeControls('test-time-controls');
            
            const yearChanges = [];
            controls.onYearChange = (year) => { yearChanges.push(year); };
            
            controls.setYear(2005, true);
            controls.setYear(2006, true);
            
            expect(yearChanges).toEqual([2005, 2006]);
            
            controls.destroy();
        });

        test('should handle play state change events', () => {
            const controls = new TimeControls('test-time-controls');
            
            const playStateChanges = [];
            controls.onPlayStateChange = (playing) => { playStateChanges.push(playing); };
            
            controls.play();
            controls.pause();
            
            expect(playStateChanges).toEqual([true, false]);
            
            controls.destroy();
        });

        test('should handle speed change events', () => {
            const controls = new TimeControls('test-time-controls');
            
            const speedChanges = [];
            controls.onSpeedChange = (speed) => { speedChanges.push(speed); };
            
            controls.setSpeed(2);
            controls.setSpeed(0.5);
            
            expect(speedChanges).toEqual([2, 0.5]);
            
            controls.destroy();
        });
    });

    describe('Component Cleanup', () => {
        test('should destroy component and clean up', () => {
            const controls = new TimeControls('test-time-controls');
            
            // Start animation to test cleanup
            controls.play();
            expect(controls.isAnimationPlaying()).toBe(true);
            
            // Verify component exists
            expect(container.children.length).toBeGreaterThan(0);
            
            // Destroy component
            controls.destroy();
            
            // Verify cleanup
            expect(container.innerHTML).toBe('');
            expect(controls.isAnimationPlaying()).toBe(false);
            expect(controls.availableYears).toEqual([]);
            expect(controls.currentYear).toBe(controls.config.startYear);
        });
    });
});