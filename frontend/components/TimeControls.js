/**
 * Time Controls Component for CO2-GDP Visualization
 * 
 * This component provides time slider and play/pause controls for animating
 * through years in the scatter plot visualization. It integrates with the
 * AnimatedScatterPlot component to control temporal animation.
 */

class TimeControls {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        // Configuration options
        this.config = {
            startYear: options.startYear || 1990,
            endYear: options.endYear || 2020,
            currentYear: options.currentYear || options.startYear || 1990,
            animationSpeed: options.animationSpeed || 1000, // milliseconds per year
            showYearDisplay: options.showYearDisplay !== false,
            showSpeedControl: options.showSpeedControl !== false,
            playButtonText: options.playButtonText || '¶',
            pauseButtonText: options.pauseButtonText || 'ø',
            ...options
        };
        
        // State
        this.availableYears = [];
        this.currentYear = this.config.currentYear;
        this.isPlaying = false;
        this.playInterval = null;
        this.speedMultiplier = 1;
        
        // Event callbacks
        this.onYearChange = options.onYearChange || null;
        this.onPlayStateChange = options.onPlayStateChange || null;
        this.onSpeedChange = options.onSpeedChange || null;
        
        // DOM elements
        this.controlsElement = null;
        this.playButton = null;
        this.yearSlider = null;
        this.yearDisplay = null;
        this.speedControl = null;
        this.progressBar = null;
        
        this.initializeComponent();
    }
    
    /**
     * Initialize the time controls component
     */
    initializeComponent() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create main controls container
        this.controlsElement = document.createElement('div');
        this.controlsElement.className = 'time-controls';
        
        // Create play/pause button
        this.createPlayButton();
        
        // Create year slider
        this.createYearSlider();
        
        // Create year display
        if (this.config.showYearDisplay) {
            this.createYearDisplay();
        }
        
        // Create speed control
        if (this.config.showSpeedControl) {
            this.createSpeedControl();
        }
        
        // Create progress bar
        this.createProgressBar();
        
        // Add to container
        this.container.appendChild(this.controlsElement);
        
        // Add styles
        this.addStyles();
        
        // Initialize years array
        this.updateAvailableYears();
        
        // Set initial state
        this.updateDisplay();
    }
    
    /**
     * Create play/pause button
     */
    createPlayButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'play-button-container';
        
        this.playButton = document.createElement('button');
        this.playButton.className = 'play-button';
        this.playButton.setAttribute('type', 'button');
        this.playButton.setAttribute('aria-label', 'Play animation');
        this.playButton.innerHTML = this.config.playButtonText;
        
        this.playButton.addEventListener('click', () => this.togglePlayPause());
        
        // Keyboard support
        this.playButton.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
        
        buttonContainer.appendChild(this.playButton);
        this.controlsElement.appendChild(buttonContainer);
    }
    
    /**
     * Create year slider
     */
    createYearSlider() {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        
        // Create slider labels
        const startLabel = document.createElement('span');
        startLabel.className = 'slider-label start-label';
        startLabel.textContent = this.config.startYear;
        
        const endLabel = document.createElement('span');
        endLabel.className = 'slider-label end-label';
        endLabel.textContent = this.config.endYear;
        
        // Create slider
        this.yearSlider = document.createElement('input');
        this.yearSlider.type = 'range';
        this.yearSlider.className = 'year-slider';
        this.yearSlider.min = this.config.startYear;
        this.yearSlider.max = this.config.endYear;
        this.yearSlider.value = this.currentYear;
        this.yearSlider.step = 1;
        this.yearSlider.setAttribute('aria-label', 'Select year');
        
        this.yearSlider.addEventListener('input', (e) => {
            this.setYear(parseInt(e.target.value), false);
        });
        
        this.yearSlider.addEventListener('change', (e) => {
            this.setYear(parseInt(e.target.value), true);
        });
        
        // Keyboard support for fine control
        this.yearSlider.addEventListener('keydown', (e) => {
            let newYear = this.currentYear;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                    newYear = Math.max(this.config.startYear, this.currentYear - 1);
                    break;
                case 'ArrowRight':
                case 'ArrowUp':
                    newYear = Math.min(this.config.endYear, this.currentYear + 1);
                    break;
                case 'Home':
                    newYear = this.config.startYear;
                    break;
                case 'End':
                    newYear = this.config.endYear;
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    return;
                default:
                    return;
            }
            
            if (newYear !== this.currentYear) {
                e.preventDefault();
                this.setYear(newYear, true);
            }
        });
        
        // Assemble slider container
        sliderContainer.appendChild(startLabel);
        sliderContainer.appendChild(this.yearSlider);
        sliderContainer.appendChild(endLabel);
        
        this.controlsElement.appendChild(sliderContainer);
    }
    
    /**
     * Create year display
     */
    createYearDisplay() {
        const displayContainer = document.createElement('div');
        displayContainer.className = 'year-display-container';
        
        const label = document.createElement('span');
        label.className = 'year-display-label';
        label.textContent = 'Year: ';
        
        this.yearDisplay = document.createElement('span');
        this.yearDisplay.className = 'year-display-value';
        this.yearDisplay.textContent = this.currentYear;
        
        displayContainer.appendChild(label);
        displayContainer.appendChild(this.yearDisplay);
        
        this.controlsElement.appendChild(displayContainer);
    }
    
    /**
     * Create speed control
     */
    createSpeedControl() {
        const speedContainer = document.createElement('div');
        speedContainer.className = 'speed-control-container';
        
        const label = document.createElement('label');
        label.className = 'speed-control-label';
        label.textContent = 'Speed: ';
        
        this.speedControl = document.createElement('select');
        this.speedControl.className = 'speed-control';
        this.speedControl.setAttribute('aria-label', 'Animation speed');
        
        // Speed options
        const speedOptions = [
            { value: 0.25, label: '0.25x' },
            { value: 0.5, label: '0.5x' },
            { value: 1, label: '1x' },
            { value: 1.5, label: '1.5x' },
            { value: 2, label: '2x' },
            { value: 3, label: '3x' }
        ];
        
        speedOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            if (option.value === 1) {
                optionElement.selected = true;
            }
            this.speedControl.appendChild(optionElement);
        });
        
        this.speedControl.addEventListener('change', (e) => {
            this.setSpeed(parseFloat(e.target.value));
        });
        
        label.appendChild(this.speedControl);
        speedContainer.appendChild(label);
        
        this.controlsElement.appendChild(speedContainer);
    }
    
    /**
     * Create progress bar
     */
    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        
        this.progressBar.appendChild(progressFill);
        progressContainer.appendChild(this.progressBar);
        
        this.controlsElement.appendChild(progressContainer);
    }
    
    /**
     * Add CSS styles for the component
     */
    addStyles() {
        if (document.getElementById('time-controls-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'time-controls-styles';
        style.textContent = `
            .time-controls {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 15px 20px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .play-button-container {
                display: flex;
                align-items: center;
            }
            
            .play-button {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .play-button:hover {
                background: #0056b3;
                transform: scale(1.05);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .play-button:active {
                transform: scale(0.95);
            }
            
            .play-button:focus {
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            
            .play-button.playing {
                background: #dc3545;
            }
            
            .play-button.playing:hover {
                background: #c82333;
            }
            
            .slider-container {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
                min-width: 200px;
            }
            
            .slider-label {
                font-size: 12px;
                color: #666;
                font-weight: 500;
                min-width: 40px;
                text-align: center;
            }
            
            .year-slider {
                flex: 1;
                height: 8px;
                background: #ddd;
                border-radius: 4px;
                outline: none;
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
            }
            
            .year-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #007bff;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .year-slider::-webkit-slider-thumb:hover {
                background: #0056b3;
                transform: scale(1.1);
            }
            
            .year-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #007bff;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .year-slider::-moz-range-thumb:hover {
                background: #0056b3;
                transform: scale(1.1);
            }
            
            .year-slider:focus {
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            
            .year-display-container {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 16px;
                font-weight: 500;
                min-width: 80px;
            }
            
            .year-display-label {
                color: #666;
            }
            
            .year-display-value {
                color: #007bff;
                font-weight: 700;
                font-size: 18px;
            }
            
            .speed-control-container {
                display: flex;
                align-items: center;
            }
            
            .speed-control-label {
                font-size: 14px;
                color: #666;
                font-weight: 500;
            }
            
            .speed-control {
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                outline: none;
                transition: border-color 0.2s ease;
            }
            
            .speed-control:hover {
                border-color: #007bff;
            }
            
            .speed-control:focus {
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            
            .progress-container {
                display: flex;
                align-items: center;
                min-width: 100px;
            }
            
            .progress-bar {
                width: 100%;
                height: 4px;
                background: #e9ecef;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #007bff, #0056b3);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .time-controls {
                    flex-direction: column;
                    gap: 15px;
                    padding: 15px;
                }
                
                .slider-container {
                    width: 100%;
                    min-width: unset;
                }
                
                .year-display-container,
                .speed-control-container {
                    align-self: center;
                }
            }
            
            /* Animation for smooth transitions */
            .time-controls * {
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Update available years based on range
     */
    updateAvailableYears() {
        this.availableYears = [];
        for (let year = this.config.startYear; year <= this.config.endYear; year++) {
            this.availableYears.push(year);
        }
    }
    
    /**
     * Set the current year
     */
    setYear(year, triggerCallback = true) {
        if (year < this.config.startYear || year > this.config.endYear) {
            return;
        }
        
        this.currentYear = year;
        this.updateDisplay();
        
        if (triggerCallback && this.onYearChange) {
            this.onYearChange(year);
        }
    }
    
    /**
     * Set year range
     */
    setYearRange(startYear, endYear, currentYear = null) {
        this.config.startYear = startYear;
        this.config.endYear = endYear;
        
        if (currentYear !== null) {
            this.config.currentYear = currentYear;
            this.currentYear = currentYear;
        } else if (this.currentYear < startYear || this.currentYear > endYear) {
            this.currentYear = startYear;
        }
        
        this.updateAvailableYears();
        
        // Update slider
        if (this.yearSlider) {
            this.yearSlider.min = startYear;
            this.yearSlider.max = endYear;
            this.yearSlider.value = this.currentYear;
        }
        
        // Update labels
        const startLabel = this.container.querySelector('.start-label');
        const endLabel = this.container.querySelector('.end-label');
        if (startLabel) startLabel.textContent = startYear;
        if (endLabel) endLabel.textContent = endYear;
        
        this.updateDisplay();
    }
    
    /**
     * Toggle play/pause animation
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * Start animation
     */
    play() {
        if (this.isPlaying || this.availableYears.length === 0) return;
        
        this.isPlaying = true;
        this.updatePlayButton();
        
        const duration = this.config.animationSpeed / this.speedMultiplier;
        let currentIndex = this.availableYears.indexOf(this.currentYear);
        
        this.playInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % this.availableYears.length;
            this.setYear(this.availableYears[currentIndex], true);
            
            // If we've completed a full cycle, stop
            if (currentIndex === 0) {
                this.pause();
            }
        }, duration);
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true);
        }
    }
    
    /**
     * Pause animation
     */
    pause() {
        this.isPlaying = false;
        this.updatePlayButton();
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
    }
    
    /**
     * Stop animation and reset to start
     */
    stop() {
        this.pause();
        this.setYear(this.config.startYear, true);
    }
    
    /**
     * Set animation speed
     */
    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
        
        if (this.speedControl) {
            this.speedControl.value = multiplier;
        }
        
        // Restart animation with new speed if currently playing
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
        
        if (this.onSpeedChange) {
            this.onSpeedChange(multiplier);
        }
    }
    
    /**
     * Update display elements
     */
    updateDisplay() {
        // Update slider
        if (this.yearSlider) {
            this.yearSlider.value = this.currentYear;
        }
        
        // Update year display
        if (this.yearDisplay) {
            this.yearDisplay.textContent = this.currentYear;
        }
        
        // Update progress bar
        this.updateProgressBar();
    }
    
    /**
     * Update play button appearance
     */
    updatePlayButton() {
        if (!this.playButton) return;
        
        if (this.isPlaying) {
            this.playButton.innerHTML = this.config.pauseButtonText;
            this.playButton.setAttribute('aria-label', 'Pause animation');
            this.playButton.classList.add('playing');
        } else {
            this.playButton.innerHTML = this.config.playButtonText;
            this.playButton.setAttribute('aria-label', 'Play animation');
            this.playButton.classList.remove('playing');
        }
    }
    
    /**
     * Update progress bar
     */
    updateProgressBar() {
        if (!this.progressBar) return;
        
        const progressFill = this.progressBar.querySelector('.progress-fill');
        if (progressFill) {
            const progress = (this.currentYear - this.config.startYear) / 
                           (this.config.endYear - this.config.startYear) * 100;
            progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
    }
    
    /**
     * Get current year
     */
    getCurrentYear() {
        return this.currentYear;
    }
    
    /**
     * Get available years
     */
    getAvailableYears() {
        return [...this.availableYears];
    }
    
    /**
     * Check if animation is playing
     */
    isAnimationPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Get current speed multiplier
     */
    getCurrentSpeed() {
        return this.speedMultiplier;
    }
    
    /**
     * Enable/disable controls
     */
    setEnabled(enabled) {
        const elements = [this.playButton, this.yearSlider, this.speedControl];
        elements.forEach(element => {
            if (element) {
                element.disabled = !enabled;
            }
        });
        
        if (this.controlsElement) {
            this.controlsElement.style.opacity = enabled ? '1' : '0.5';
        }
    }
    
    /**
     * Destroy the component and clean up
     */
    destroy() {
        // Stop any running animation
        this.pause();
        
        // Clear container
        this.container.innerHTML = '';
        
        // Reset state
        this.availableYears = [];
        this.currentYear = this.config.startYear;
        this.isPlaying = false;
        this.playInterval = null;
        this.speedMultiplier = 1;
        
        // Remove styles if no other instances exist
        const otherControls = document.querySelectorAll('.time-controls');
        if (otherControls.length === 0) {
            const styles = document.getElementById('time-controls-styles');
            if (styles) {
                styles.remove();
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports = TimeControls;
}
if (typeof window !== 'undefined') {
    window.TimeControls = TimeControls;
}