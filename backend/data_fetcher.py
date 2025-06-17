"""
World Bank Data Fetcher for CO2 emissions and GDP per capita data.

This module provides functionality to retrieve, process, and serve CO2 emissions
and GDP per capita data from the World Bank API using wbgapi library.
"""

import logging
import pandas as pd
import wbgapi as wb
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorldBankDataFetcher:
    """
    Handles fetching and processing of World Bank data for CO2 emissions and GDP per capita.
    """
    
    # World Bank indicator codes
    CO2_INDICATOR = 'EN.ATM.CO2E.PC'  # CO2 emissions (metric tons per capita)
    GDP_INDICATOR = 'NY.GDP.PCAP.CD'  # GDP per capita (current US$)
    
    def __init__(self):
        """Initialize the data fetcher."""
        self.last_update = None
        self.cached_data = None
        
    def get_countries_list(self) -> List[Dict[str, str]]:
        """
        Fetch list of available countries from World Bank API.
        
        Returns:
            List of dictionaries containing country code and name.
        """
        try:
            logger.info("Fetching countries list from World Bank API")
            countries = wb.economy.list()
            
            # Filter out aggregates and regions, keep only countries
            country_list = []
            for country in countries:
                # Skip aggregates and regions
                if country.get('incomeLevel') and country.get('region'):
                    country_list.append({
                        'code': country['id'],
                        'name': country['value']
                    })
            
            logger.info(f"Retrieved {len(country_list)} countries")
            return sorted(country_list, key=lambda x: x['name'])
            
        except Exception as e:
            logger.error(f"Error fetching countries list: {str(e)}")
            raise
    
    def fetch_indicator_data(self, indicator: str, countries: Optional[List[str]] = None, 
                           start_year: int = 1990, end_year: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch data for a specific World Bank indicator.
        
        Args:
            indicator: World Bank indicator code
            countries: List of country codes. If None, fetches for all countries
            start_year: Starting year for data retrieval
            end_year: Ending year for data retrieval. If None, uses current year
            
        Returns:
            DataFrame with columns: country_code, country_name, year, value
        """
        try:
            if end_year is None:
                end_year = datetime.now().year
                
            logger.info(f"Fetching {indicator} data for years {start_year}-{end_year}")
            
            # Fetch data from World Bank API
            data = wb.data.DataFrame(
                indicator,
                economy=countries,
                time=range(start_year, end_year + 1),
                skipAggs=True,
                skipBlanks=True
            )
            
            if data.empty:
                logger.warning(f"No data found for indicator {indicator}")
                return pd.DataFrame(columns=['country_code', 'country_name', 'year', 'value'])
            
            # Reset index to get country and year as columns
            data = data.reset_index()
            
            # Melt the dataframe to long format
            melted_data = data.melt(
                id_vars=['economy'],
                var_name='year',
                value_name='value'
            )
            
            # Clean and format data
            melted_data = melted_data.dropna(subset=['value'])
            melted_data['year'] = melted_data['year'].astype(int)
            melted_data['value'] = pd.to_numeric(melted_data['value'], errors='coerce')
            melted_data = melted_data.dropna(subset=['value'])
            
            # Get country names
            countries_info = wb.economy.list()
            country_names = {c['id']: c['value'] for c in countries_info}
            
            melted_data['country_name'] = melted_data['economy'].map(country_names)
            melted_data = melted_data.rename(columns={'economy': 'country_code'})
            
            # Reorder columns
            melted_data = melted_data[['country_code', 'country_name', 'year', 'value']]
            
            logger.info(f"Retrieved {len(melted_data)} data points for {indicator}")
            return melted_data
            
        except Exception as e:
            logger.error(f"Error fetching indicator data for {indicator}: {str(e)}")
            raise
    
    def fetch_co2_data(self, countries: Optional[List[str]] = None, 
                       start_year: int = 1990, end_year: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch CO2 emissions data.
        
        Args:
            countries: List of country codes
            start_year: Starting year
            end_year: Ending year
            
        Returns:
            DataFrame with CO2 emissions data
        """
        if end_year is None:
            end_year = datetime.now().year
        return self.fetch_indicator_data(
            self.CO2_INDICATOR, countries, start_year, end_year
        )
    
    def fetch_gdp_data(self, countries: Optional[List[str]] = None,
                       start_year: int = 1990, end_year: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch GDP per capita data.
        
        Args:
            countries: List of country codes
            start_year: Starting year
            end_year: Ending year
            
        Returns:
            DataFrame with GDP per capita data
        """
        if end_year is None:
            end_year = datetime.now().year
        return self.fetch_indicator_data(
            self.GDP_INDICATOR, countries, start_year, end_year
        )
    
    def fetch_combined_data(self, countries: Optional[List[str]] = None,
                          start_year: int = 1990, end_year: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch both CO2 and GDP data and combine them.
        
        Args:
            countries: List of country codes
            start_year: Starting year
            end_year: Ending year
            
        Returns:
            DataFrame with combined CO2 and GDP data
        """
        try:
            if end_year is None:
                end_year = datetime.now().year
                
            logger.info("Fetching combined CO2 and GDP data")
            
            # Fetch both datasets
            co2_data = self.fetch_co2_data(countries, start_year, end_year)
            gdp_data = self.fetch_gdp_data(countries, start_year, end_year)
            
            if co2_data.empty or gdp_data.empty:
                logger.warning("One or both datasets are empty")
                return pd.DataFrame()
            
            # Rename value columns
            co2_data = co2_data.rename(columns={'value': 'co2_emissions'})
            gdp_data = gdp_data.rename(columns={'value': 'gdp_per_capita'})
            
            # Merge datasets on country_code, country_name, and year
            combined_data = pd.merge(
                co2_data,
                gdp_data,
                on=['country_code', 'country_name', 'year'],
                how='inner'
            )
            
            # Remove rows with missing data
            combined_data = combined_data.dropna(subset=['co2_emissions', 'gdp_per_capita'])
            
            logger.info(f"Combined dataset contains {len(combined_data)} data points")
            return combined_data
            
        except Exception as e:
            logger.error(f"Error fetching combined data: {str(e)}")
            raise
    
    def get_data_for_api(self, countries: Optional[List[str]] = None,
                        start_year: int = 1990, end_year: Optional[int] = None) -> Dict:
        """
        Get formatted data for API response.
        
        Args:
            countries: List of country codes
            start_year: Starting year
            end_year: Ending year
            
        Returns:
            Dictionary formatted for JSON API response
        """
        try:
            combined_data = self.fetch_combined_data(countries, start_year, end_year)
            
            if combined_data.empty:
                return {
                    'data': [],
                    'metadata': {
                        'total_records': 0,
                        'countries': 0,
                        'years': f"{start_year}-{end_year or datetime.now().year}",
                        'last_updated': datetime.now().isoformat()
                    }
                }
            
            # Convert to list of dictionaries
            data_records = combined_data.to_dict('records')
            
            # Create metadata
            metadata = {
                'total_records': len(data_records),
                'countries': combined_data['country_code'].nunique(),
                'years': f"{combined_data['year'].min()}-{combined_data['year'].max()}",
                'last_updated': datetime.now().isoformat(),
                'indicators': {
                    'co2': {
                        'code': self.CO2_INDICATOR,
                        'name': 'CO2 emissions (metric tons per capita)'
                    },
                    'gdp': {
                        'code': self.GDP_INDICATOR,
                        'name': 'GDP per capita (current US$)'
                    }
                }
            }
            
            return {
                'data': data_records,
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Error formatting data for API: {str(e)}")
            raise


# Convenience functions for direct use
def get_countries():
    """Get list of available countries."""
    fetcher = WorldBankDataFetcher()
    return fetcher.get_countries_list()

def get_co2_gdp_data(countries=None, start_year=1990, end_year=None):
    """Get combined CO2 and GDP data."""
    fetcher = WorldBankDataFetcher()
    return fetcher.get_data_for_api(countries, start_year, end_year)

def get_co2_data(countries=None, start_year=1990, end_year=None):
    """Get CO2 emissions data only."""
    fetcher = WorldBankDataFetcher()
    return fetcher.fetch_co2_data(countries, start_year, end_year)

def get_gdp_data(countries=None, start_year=1990, end_year=None):
    """Get GDP per capita data only."""
    fetcher = WorldBankDataFetcher()
    return fetcher.fetch_gdp_data(countries, start_year, end_year)