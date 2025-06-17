/**
 * Animated Scatter Plot Component for CO2 vs GDP Visualization
 * 
 * This component creates an interactive D3.js scatter plot that visualizes
 * the relationship between CO2 emissions and GDP per capita over time,
 * with animation capabilities and country selection features.
 */

class AnimatedScatterPlot {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        
        // Configuration options
        this.config = {
            width: options.width || 800,
            height: options.height || 600,
            margin: { top: 40, right: 120, bottom: 60, left: 80 },
            animationDuration: options.animationDuration || 1000,
            dotRadius: options.dotRadius || 5,
            maxDotRadius: options.maxDotRadius || 20,
            ...options
        };
        
        // Calculate inner dimensions
        this.innerWidth = this.config.width - this.config.margin.left - this.config.margin.right;
        this.innerHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
        
        // Data and state
        this.data = [];
        this.filteredData = [];
        this.currentYear = null;
        this.selectedCountries = [];
        this.isPlaying = false;
        this.playInterval = null;
        this.availableYears = [];
        
        // Scales and axes
        this.xScale = null;
        this.yScale = null;
        this.colorScale = null;
        this.sizeScale = null;
        
        // Event callbacks
        this.onYearChange = options.onYearChange || null;
        this.onCountrySelect = options.onCountrySelect || null;
        this.onDataUpdate = options.onDataUpdate || null;
        
        this.initializeSVG();
        this.setupScales();
        this.setupAxes();
        this.setupLegend();
        this.setupTooltip();
    }
    
    /**
     * Initialize the SVG container and main elements
     */
    initializeSVG() {
        // Clear any existing content
        this.container.selectAll('*').remove();
        
        // Create main SVG
        this.svg = this.container
            .append('svg')
            .attr('width', this.config.width)
            .attr('height', this.config.height)
            .attr('class', 'scatter-plot-svg');
        
        // Create main group with margins
        this.g = this.svg
            .append('g')
            .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);
        
        // Create groups for different elements
        this.axisGroup = this.g.append('g').attr('class', 'axis-group');
        this.plotGroup = this.g.append('g').attr('class', 'plot-group');
        this.legendGroup = this.g.append('g').attr('class', 'legend-group');
        
        // Add title
        this.svg
            .append('text')
            .attr('class', 'chart-title')
            .attr('x', this.config.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('CO� Emissions vs GDP per Capita');
    }
    
    /**
     * Setup scales for x, y, color, and size
     */
    setupScales() {
        // X scale for GDP per capita (log scale for better distribution)
        this.xScale = d3.scaleLog()
            .domain([100, 100000])
            .range([0, this.innerWidth])
            .clamp(true);
        
        // Y scale for CO2 emissions per capita
        this.yScale = d3.scaleLinear()
            .domain([0, 50])
            .range([this.innerHeight, 0]);
        
        // Color scale for countries (categorical)
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        
        // Size scale for population (if available)
        this.sizeScale = d3.scaleSqrt()
            .domain([0, 1000000000])
            .range([3, this.config.maxDotRadius]);
    }
    
    /**
     * Setup axes with labels
     */
    setupAxes() {
        // X axis
        this.xAxis = this.axisGroup
            .append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`);
        
        // Y axis
        this.yAxis = this.axisGroup
            .append('g')
            .attr('class', 'y-axis');
        
        // X axis label
        this.axisGroup
            .append('text')
            .attr('class', 'x-axis-label')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('GDP per Capita (USD, log scale)');
        
        // Y axis label
        this.axisGroup
            .append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('CO� Emissions per Capita (metric tons)');
        
        this.updateAxes();
    }
    
    /**
     * Update axes with current scale domains
     */
    updateAxes() {
        this.xAxis
            .transition()
            .duration(this.config.animationDuration)
            .call(d3.axisBottom(this.xScale)
                .tickFormat(d => d3.format('$,.0f')(d))
                .ticks(8));
        
        this.yAxis
            .transition()
            .duration(this.config.animationDuration)
            .call(d3.axisLeft(this.yScale)
                .tickFormat(d => d3.format('.1f')(d))
                .ticks(8));
    }
    
    /**
     * Setup legend for countries
     */
    setupLegend() {
        this.legend = this.legendGroup
            .attr('transform', `translate(${this.innerWidth + 20}, 20)`);
        
        this.legend
            .append('text')
            .attr('class', 'legend-title')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Countries');
    }
    
    /**
     * Setup tooltip for data points
     */
    setupTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'scatter-plot-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('font-size', '12px')
            .style('z-index', 1000);
    }
    
    /**
     * Load and process data from the API
     */
    async loadData(countries = [], startYear = 1990, endYear = 2020) {
        try {
            // Import API functions
            const api = await import('../utils/api.js');
            
            // Fetch combined data
            const response = await api.fetchValidatedData({
                countries: countries.length > 0 ? countries : undefined,
                startYear: startYear,
                endYear: endYear
            });
            
            // Process and combine CO2 and GDP data
            this.processData(response);
            
            // Update available years
            this.availableYears = [...new Set(this.data.map(d => d.year))].sort();
            
            // Set initial year
            if (!this.currentYear && this.availableYears.length > 0) {
                this.currentYear = this.availableYears[0];
            }
            
            // Update scales based on data
            this.updateScales();
            
            // Initial render
            this.render();
            
            // Trigger callback
            if (this.onDataUpdate) {
                this.onDataUpdate(this.data);
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data: ' + error.message);
        }
    }
    
    /**
     * Process raw API data into visualization format
     */
    processData(response) {
        this.data = [];
        
        if (!response.data || !response.data.co2_data || !response.data.gdp_data) {
            throw new Error('Invalid data format from API');
        }
        
        const co2Data = response.data.co2_data;
        const gdpData = response.data.gdp_data;
        
        // Combine CO2 and GDP data by country and year
        Object.keys(co2Data).forEach(countryCode => {
            const countryName = response.metadata?.countries?.[countryCode]?.name || countryCode;
            const co2Values = co2Data[countryCode];
            const gdpValues = gdpData[countryCode];
            
            if (co2Values && gdpValues) {
                Object.keys(co2Values).forEach(year => {
                    const co2Value = co2Values[year];
                    const gdpValue = gdpValues[year];
                    
                    if (co2Value !== null && gdpValue !== null && 
                        co2Value > 0 && gdpValue > 0) {
                        this.data.push({
                            country: countryName,
                            countryCode: countryCode,
                            year: parseInt(year),
                            co2PerCapita: co2Value,
                            gdpPerCapita: gdpValue,
                            population: null // Could be added if available
                        });
                    }
                });
            }
        });
        
        // Sort data by year and country
        this.data.sort((a, b) => a.year - b.year || a.country.localeCompare(b.country));
    }
    
    /**
     * Update scales based on current data
     */
    updateScales() {
        if (this.data.length === 0) return;
        
        // Update X scale domain (GDP per capita)
        const gdpExtent = d3.extent(this.data, d => d.gdpPerCapita);
        this.xScale.domain([
            Math.max(100, gdpExtent[0] * 0.8),
            gdpExtent[1] * 1.2
        ]);
        
        // Update Y scale domain (CO2 per capita)
        const co2Extent = d3.extent(this.data, d => d.co2PerCapita);
        this.yScale.domain([0, co2Extent[1] * 1.1]);
        
        // Update color scale domain (countries)
        const countries = [...new Set(this.data.map(d => d.country))];
        this.colorScale.domain(countries);
        
        this.updateAxes();
    }
    
    /**
     * Filter data for current year and selected countries
     */
    filterData() {
        this.filteredData = this.data.filter(d => {
            const yearMatch = d.year === this.currentYear;
            const countryMatch = this.selectedCountries.length === 0 || 
                                 this.selectedCountries.includes(d.countryCode);
            return yearMatch && countryMatch;
        });
    }
    
    /**
     * Render the scatter plot
     */
    render() {
        if (!this.currentYear) return;
        
        this.filterData();
        
        // Update year display
        this.updateYearDisplay();
        
        // Bind data to circles
        const circles = this.plotGroup
            .selectAll('.data-point')
            .data(this.filteredData, d => d.countryCode);
        
        // Enter selection
        const circlesEnter = circles
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('r', 0)
            .attr('cx', d => this.xScale(d.gdpPerCapita))
            .attr('cy', d => this.yScale(d.co2PerCapita))
            .style('fill', d => this.colorScale(d.country))
            .style('stroke', '#fff')
            .style('stroke-width', 1)
            .style('opacity', 0.7)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.selectCountry(d.countryCode));
        
        // Update selection (enter + update)
        const circlesUpdate = circlesEnter.merge(circles);
        
        circlesUpdate
            .transition()
            .duration(this.config.animationDuration)
            .attr('cx', d => this.xScale(d.gdpPerCapita))
            .attr('cy', d => this.yScale(d.co2PerCapita))
            .attr('r', this.config.dotRadius)
            .style('opacity', 0.7);
        
        // Exit selection
        circles
            .exit()
            .transition()
            .duration(this.config.animationDuration)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();
        
        // Update legend
        this.updateLegend();
    }
    
    /**
     * Update year display
     */
    updateYearDisplay() {
        let yearDisplay = this.svg.select('.year-display');
        
        if (yearDisplay.empty()) {
            yearDisplay = this.svg
                .append('text')
                .attr('class', 'year-display')
                .attr('x', this.config.width - 100)
                .attr('y', 50)
                .attr('text-anchor', 'middle')
                .style('font-size', '24px')
                .style('font-weight', 'bold')
                .style('fill', '#666');
        }
        
        yearDisplay.text(this.currentYear);
    }
    
    /**
     * Update legend with current countries
     */
    updateLegend() {
        const countries = [...new Set(this.filteredData.map(d => d.country))];
        
        const legendItems = this.legend
            .selectAll('.legend-item')
            .data(countries);
        
        const legendEnter = legendItems
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${(i + 1) * 20})`);
        
        legendEnter
            .append('circle')
            .attr('r', 6)
            .attr('cx', 6)
            .attr('cy', 0)
            .style('fill', d => this.colorScale(d));
        
        legendEnter
            .append('text')
            .attr('x', 20)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(d => d);
        
        legendItems.exit().remove();
    }
    
    /**
     * Show tooltip on hover
     */
    showTooltip(event, d) {
        const tooltipContent = `
            <strong>${d.country}</strong><br/>
            Year: ${d.year}<br/>
            GDP per Capita: $${d3.format(',.0f')(d.gdpPerCapita)}<br/>
            CO� per Capita: ${d3.format('.2f')(d.co2PerCapita)} metric tons
        `;
        
        this.tooltip
            .html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
    }
    
    /**
     * Handle country selection
     */
    selectCountry(countryCode) {
        if (this.onCountrySelect) {
            this.onCountrySelect(countryCode);
        }
    }
    
    /**
     * Set current year and re-render
     */
    setYear(year) {
        if (this.availableYears.includes(year)) {
            this.currentYear = year;
            this.render();
            
            if (this.onYearChange) {
                this.onYearChange(year);
            }
        }
    }
    
    /**
     * Set selected countries filter
     */
    setSelectedCountries(countries) {
        this.selectedCountries = Array.isArray(countries) ? countries : [countries];
        this.render();
    }
    
    /**
     * Start animation through years
     */
    play() {
        if (this.isPlaying || this.availableYears.length === 0) return;
        
        this.isPlaying = true;
        let currentIndex = this.availableYears.indexOf(this.currentYear);
        
        this.playInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % this.availableYears.length;
            this.setYear(this.availableYears[currentIndex]);
            
            // If we've completed a full cycle, stop
            if (currentIndex === 0 && this.availableYears[currentIndex] === this.availableYears[0]) {
                this.stop();
            }
        }, this.config.animationDuration + 100);
    }
    
    /**
     * Stop animation
     */
    stop() {
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.container.selectAll('*').remove();
        
        this.container
            .append('div')
            .attr('class', 'error-message')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', 'red')
            .style('font-size', '16px')
            .text(message);
    }
    
    /**
     * Resize the chart
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;
        this.innerWidth = width - this.config.margin.left - this.config.margin.right;
        this.innerHeight = height - this.config.margin.top - this.config.margin.bottom;
        
        this.svg
            .attr('width', width)
            .attr('height', height);
        
        this.xScale.range([0, this.innerWidth]);
        this.yScale.range([this.innerHeight, 0]);
        
        this.setupAxes();
        this.render();
    }
    
    /**
     * Get available years
     */
    getAvailableYears() {
        return [...this.availableYears];
    }
    
    /**
     * Get current data
     */
    getCurrentData() {
        return [...this.filteredData];
    }
    
    /**
     * Destroy the component and clean up
     */
    destroy() {
        this.stop();
        
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        this.container.selectAll('*').remove();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports = AnimatedScatterPlot;
}
if (typeof window !== 'undefined') {
    window.AnimatedScatterPlot = AnimatedScatterPlot;
}