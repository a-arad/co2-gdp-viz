/**
 * Country Dropdown Component for CO2-GDP Visualization
 * 
 * This component provides a multi-select dropdown interface for selecting
 * countries to filter the data visualization. It integrates with the backend
 * API to fetch available countries and provides callback functionality for
 * selection changes.
 */

class CountryDropdown {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        // Configuration options
        this.config = {
            placeholder: options.placeholder || 'Select countries...',
            maxHeight: options.maxHeight || '200px',
            searchPlaceholder: options.searchPlaceholder || 'Search countries...',
            maxSelectedDisplay: options.maxSelectedDisplay || 3,
            allowSelectAll: options.allowSelectAll !== false,
            ...options
        };
        
        // State
        this.countries = [];
        this.selectedCountries = [];
        this.filteredCountries = [];
        this.isOpen = false;
        this.searchTerm = '';
        
        // Event callbacks
        this.onSelectionChange = options.onSelectionChange || null;
        this.onError = options.onError || null;
        
        // DOM elements
        this.dropdownElement = null;
        this.selectedDisplay = null;
        this.dropdownMenu = null;
        this.searchInput = null;
        this.countryList = null;
        
        this.initializeComponent();
        this.loadCountries();
    }
    
    /**
     * Initialize the dropdown component structure
     */
    initializeComponent() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create main dropdown structure
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.className = 'country-dropdown';
        
        // Create selected display area
        this.selectedDisplay = document.createElement('div');
        this.selectedDisplay.className = 'selected-display';
        this.selectedDisplay.addEventListener('click', () => this.toggleDropdown());
        
        // Create dropdown menu
        this.dropdownMenu = document.createElement('div');
        this.dropdownMenu.className = 'dropdown-menu';
        this.dropdownMenu.style.display = 'none';
        this.dropdownMenu.style.maxHeight = this.config.maxHeight;
        
        // Create search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'search-input';
        this.searchInput.placeholder = this.config.searchPlaceholder;
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('click', (e) => e.stopPropagation());
        
        // Create country list container
        this.countryList = document.createElement('div');
        this.countryList.className = 'country-list';
        
        // Assemble components
        this.dropdownMenu.appendChild(this.searchInput);
        this.dropdownMenu.appendChild(this.countryList);
        this.dropdownElement.appendChild(this.selectedDisplay);
        this.dropdownElement.appendChild(this.dropdownMenu);
        this.container.appendChild(this.dropdownElement);
        
        // Add styles
        this.addStyles();
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdownElement.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Handle keyboard navigation
        this.setupKeyboardNavigation();
        
        // Initial display update
        this.updateSelectedDisplay();
    }
    
    /**
     * Add CSS styles for the component
     */
    addStyles() {
        if (document.getElementById('country-dropdown-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'country-dropdown-styles';
        style.textContent = `
            .country-dropdown {
                position: relative;
                min-width: 200px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .selected-display {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border: 2px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                min-height: 20px;
                transition: border-color 0.2s ease;
            }
            
            .selected-display:hover {
                border-color: #007bff;
            }
            
            .selected-display.open {
                border-color: #007bff;
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }
            
            .selected-items {
                flex: 1;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                align-items: center;
            }
            
            .selected-item {
                background: #007bff;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .selected-item .remove {
                cursor: pointer;
                font-weight: bold;
                padding: 0 2px;
            }
            
            .selected-item .remove:hover {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }
            
            .placeholder {
                color: #666;
                font-style: italic;
            }
            
            .selected-count {
                color: #666;
                font-size: 12px;
            }
            
            .dropdown-arrow {
                margin-left: auto;
                transition: transform 0.2s ease;
            }
            
            .dropdown-arrow.open {
                transform: rotate(180deg);
            }
            
            .dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                border: 2px solid #007bff;
                border-top: none;
                border-bottom-left-radius: 6px;
                border-bottom-right-radius: 6px;
                background: white;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                overflow: hidden;
            }
            
            .search-input {
                width: 100%;
                padding: 8px 12px;
                border: none;
                border-bottom: 1px solid #eee;
                outline: none;
                font-size: 14px;
            }
            
            .search-input:focus {
                border-bottom-color: #007bff;
            }
            
            .country-list {
                max-height: calc(200px - 40px);
                overflow-y: auto;
            }
            
            .country-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-left: 3px solid transparent;
            }
            
            .country-item:hover {
                background-color: #f8f9fa;
            }
            
            .country-item.selected {
                background-color: #e3f2fd;
                border-left-color: #007bff;
            }
            
            .country-item.focused {
                background-color: #f0f8ff;
                outline: 2px solid #007bff;
                outline-offset: -2px;
            }
            
            .country-checkbox {
                margin-right: 8px;
                accent-color: #007bff;
            }
            
            .country-name {
                flex: 1;
                font-size: 14px;
            }
            
            .country-code {
                font-size: 12px;
                color: #666;
                font-family: monospace;
            }
            
            .select-all-item {
                border-bottom: 1px solid #eee;
                font-weight: 600;
            }
            
            .no-results {
                padding: 16px 12px;
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            .loading {
                padding: 16px 12px;
                text-align: center;
                color: #666;
            }
            
            .error {
                padding: 16px 12px;
                text-align: center;
                color: #dc3545;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                margin: 4px;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Setup keyboard navigation for accessibility
     */
    setupKeyboardNavigation() {
        this.selectedDisplay.setAttribute('tabindex', '0');
        this.selectedDisplay.setAttribute('role', 'combobox');
        this.selectedDisplay.setAttribute('aria-expanded', 'false');
        this.selectedDisplay.setAttribute('aria-haspopup', 'listbox');
        
        this.selectedDisplay.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.toggleDropdown();
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
                case 'ArrowDown':
                    if (!this.isOpen) {
                        e.preventDefault();
                        this.openDropdown();
                    }
                    break;
            }
        });
    }
    
    /**
     * Load countries from the API
     */
    async loadCountries() {
        try {
            this.showLoading();
            
            // Import API functions
            const api = await import('../utils/api.js');
            
            // Fetch countries
            const response = await api.fetchCountries();
            
            if (!response.countries || !Array.isArray(response.countries)) {
                throw new Error('Invalid countries data format');
            }
            
            // Sort countries by name
            this.countries = response.countries.sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            
            this.filteredCountries = [...this.countries];
            this.renderCountryList();
            
        } catch (error) {
            console.error('Error loading countries:', error);
            this.showError(error.message);
            
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.countryList.innerHTML = '<div class="loading">Loading countries...</div>';
    }
    
    /**
     * Show error state
     */
    showError(message) {
        this.countryList.innerHTML = `<div class="error">Error: ${message}</div>`;
    }
    
    /**
     * Handle search input
     */
    handleSearch(term) {
        this.searchTerm = term.toLowerCase();
        
        if (this.searchTerm === '') {
            this.filteredCountries = [...this.countries];
        } else {
            this.filteredCountries = this.countries.filter(country =>
                country.name.toLowerCase().includes(this.searchTerm) ||
                country.code.toLowerCase().includes(this.searchTerm)
            );
        }
        
        this.renderCountryList();
    }
    
    /**
     * Render the country list
     */
    renderCountryList() {
        this.countryList.innerHTML = '';
        
        if (this.filteredCountries.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = this.searchTerm ? 
                'No countries found' : 'No countries available';
            this.countryList.appendChild(noResults);
            return;
        }
        
        // Add "Select All" option if enabled
        if (this.config.allowSelectAll && this.filteredCountries.length > 1) {
            this.addSelectAllOption();
        }
        
        // Add country options
        this.filteredCountries.forEach(country => {
            this.addCountryOption(country);
        });
    }
    
    /**
     * Add "Select All" option
     */
    addSelectAllOption() {
        const item = document.createElement('div');
        item.className = 'country-item select-all-item';
        item.setAttribute('role', 'option');
        
        const allSelected = this.filteredCountries.every(country =>
            this.selectedCountries.includes(country.code)
        );
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'country-checkbox';
        checkbox.checked = allSelected;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.handleSelectAll(e.target.checked);
        });
        
        const label = document.createElement('span');
        label.className = 'country-name';
        label.textContent = allSelected ? 'Deselect All' : 'Select All';
        
        item.appendChild(checkbox);
        item.appendChild(label);
        
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                this.handleSelectAll(checkbox.checked);
            }
        });
        
        this.countryList.appendChild(item);
    }
    
    /**
     * Add individual country option
     */
    addCountryOption(country) {
        const item = document.createElement('div');
        item.className = 'country-item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-country-code', country.code);
        
        const isSelected = this.selectedCountries.includes(country.code);
        if (isSelected) {
            item.classList.add('selected');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'country-checkbox';
        checkbox.checked = isSelected;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleCountrySelection(country.code);
        });
        
        const name = document.createElement('span');
        name.className = 'country-name';
        name.textContent = country.name;
        
        const code = document.createElement('span');
        code.className = 'country-code';
        code.textContent = country.code;
        
        item.appendChild(checkbox);
        item.appendChild(name);
        item.appendChild(code);
        
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                this.toggleCountrySelection(country.code);
            }
        });
        
        this.countryList.appendChild(item);
    }
    
    /**
     * Handle "Select All" action
     */
    handleSelectAll(selectAll) {
        if (selectAll) {
            // Add all filtered countries to selection
            this.filteredCountries.forEach(country => {
                if (!this.selectedCountries.includes(country.code)) {
                    this.selectedCountries.push(country.code);
                }
            });
        } else {
            // Remove all filtered countries from selection
            this.selectedCountries = this.selectedCountries.filter(code =>
                !this.filteredCountries.some(country => country.code === code)
            );
        }
        
        this.updateDisplay();
        this.renderCountryList();
        this.triggerSelectionChange();
    }
    
    /**
     * Toggle individual country selection
     */
    toggleCountrySelection(countryCode) {
        const index = this.selectedCountries.indexOf(countryCode);
        
        if (index === -1) {
            this.selectedCountries.push(countryCode);
        } else {
            this.selectedCountries.splice(index, 1);
        }
        
        this.updateDisplay();
        this.renderCountryList();
        this.triggerSelectionChange();
    }
    
    /**
     * Remove country from selection
     */
    removeCountrySelection(countryCode) {
        const index = this.selectedCountries.indexOf(countryCode);
        if (index !== -1) {
            this.selectedCountries.splice(index, 1);
            this.updateDisplay();
            this.renderCountryList();
            this.triggerSelectionChange();
        }
    }
    
    /**
     * Update the selected display area
     */
    updateDisplay() {
        this.updateSelectedDisplay();
        this.updateDropdownMenu();
    }
    
    /**
     * Update selected countries display
     */
    updateSelectedDisplay() {
        this.selectedDisplay.innerHTML = '';
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'selected-items';
        
        if (this.selectedCountries.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder';
            placeholder.textContent = this.config.placeholder;
            itemsContainer.appendChild(placeholder);
        } else {
            // Show individual selected countries or count
            if (this.selectedCountries.length <= this.config.maxSelectedDisplay) {
                this.selectedCountries.forEach(code => {
                    const country = this.countries.find(c => c.code === code);
                    if (country) {
                        const item = this.createSelectedItem(country);
                        itemsContainer.appendChild(item);
                    }
                });
            } else {
                const count = document.createElement('span');
                count.className = 'selected-count';
                count.textContent = `${this.selectedCountries.length} countries selected`;
                itemsContainer.appendChild(count);
            }
        }
        
        const arrow = document.createElement('span');
        arrow.className = `dropdown-arrow ${this.isOpen ? 'open' : ''}`;
        arrow.innerHTML = '¼';
        
        this.selectedDisplay.appendChild(itemsContainer);
        this.selectedDisplay.appendChild(arrow);
        
        // Update ARIA attributes
        this.selectedDisplay.setAttribute('aria-expanded', this.isOpen.toString());
    }
    
    /**
     * Create selected item element
     */
    createSelectedItem(country) {
        const item = document.createElement('span');
        item.className = 'selected-item';
        
        const name = document.createElement('span');
        name.textContent = country.name;
        
        const remove = document.createElement('span');
        remove.className = 'remove';
        remove.innerHTML = '×';
        remove.title = `Remove ${country.name}`;
        remove.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeCountrySelection(country.code);
        });
        
        item.appendChild(name);
        item.appendChild(remove);
        
        return item;
    }
    
    /**
     * Update dropdown menu state
     */
    updateDropdownMenu() {
        if (this.isOpen) {
            this.dropdownMenu.style.display = 'block';
            this.selectedDisplay.classList.add('open');
            // Focus search input when opened
            setTimeout(() => this.searchInput.focus(), 0);
        } else {
            this.dropdownMenu.style.display = 'none';
            this.selectedDisplay.classList.remove('open');
        }
        
        // Update arrow
        const arrow = this.selectedDisplay.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.className = `dropdown-arrow ${this.isOpen ? 'open' : ''}`;
        }
    }
    
    /**
     * Toggle dropdown open/close
     */
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    /**
     * Open dropdown
     */
    openDropdown() {
        this.isOpen = true;
        this.updateDropdownMenu();
    }
    
    /**
     * Close dropdown
     */
    closeDropdown() {
        this.isOpen = false;
        this.updateDropdownMenu();
        this.clearSearch();
    }
    
    /**
     * Clear search input and reset filtered countries
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.filteredCountries = [...this.countries];
        this.renderCountryList();
    }
    
    /**
     * Trigger selection change callback
     */
    triggerSelectionChange() {
        if (this.onSelectionChange) {
            const selectedCountryData = this.selectedCountries.map(code => {
                const country = this.countries.find(c => c.code === code);
                return country || { code, name: code };
            });
            
            this.onSelectionChange(this.selectedCountries, selectedCountryData);
        }
    }
    
    /**
     * Public API: Get selected countries
     */
    getSelectedCountries() {
        return [...this.selectedCountries];
    }
    
    /**
     * Public API: Set selected countries
     */
    setSelectedCountries(countryCodes) {
        if (!Array.isArray(countryCodes)) {
            countryCodes = countryCodes ? [countryCodes] : [];
        }
        
        // Validate country codes
        const validCodes = countryCodes.filter(code =>
            this.countries.some(country => country.code === code)
        );
        
        this.selectedCountries = validCodes;
        this.updateDisplay();
        this.renderCountryList();
        this.triggerSelectionChange();
    }
    
    /**
     * Public API: Clear all selections
     */
    clearSelection() {
        this.selectedCountries = [];
        this.updateDisplay();
        this.renderCountryList();
        this.triggerSelectionChange();
    }
    
    /**
     * Public API: Get all available countries
     */
    getAvailableCountries() {
        return [...this.countries];
    }
    
    /**
     * Public API: Refresh countries data
     */
    async refresh() {
        await this.loadCountries();
    }
    
    /**
     * Public API: Check if dropdown is open
     */
    isDropdownOpen() {
        return this.isOpen;
    }
    
    /**
     * Destroy the component and clean up
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('click', this.handleDocumentClick);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Reset state
        this.countries = [];
        this.selectedCountries = [];
        this.filteredCountries = [];
        this.isOpen = false;
        
        // Remove styles if no other instances exist
        const otherDropdowns = document.querySelectorAll('.country-dropdown');
        if (otherDropdowns.length === 0) {
            const styles = document.getElementById('country-dropdown-styles');
            if (styles) {
                styles.remove();
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports = CountryDropdown;
}
if (typeof window !== 'undefined') {
    window.CountryDropdown = CountryDropdown;
}