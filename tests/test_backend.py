"""
Simplified test suite for World Bank Data Fetcher functionality.
"""

import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pandas as pd
from data_fetcher import WorldBankDataFetcher, get_countries, get_co2_gdp_data


def test_init():
    """Test initialization of WorldBankDataFetcher."""
    fetcher = WorldBankDataFetcher()
    assert fetcher.last_update is None
    assert fetcher.cached_data is None
    assert fetcher.CO2_INDICATOR == 'EN.ATM.CO2E.PC'
    assert fetcher.GDP_INDICATOR == 'NY.GDP.PCAP.CD'


@patch('data_fetcher.wb.economy.list')
def test_get_countries_list_success(mock_list):
    """Test successful retrieval of countries list."""
    # Mock response from World Bank API
    mock_list.return_value = [
        {
            'id': 'USA',
            'value': 'United States',
            'incomeLevel': {'id': 'HIC', 'value': 'High income'},
            'region': {'id': 'NAC', 'value': 'North America'}
        },
        {
            'id': 'CHN',
            'value': 'China',
            'incomeLevel': {'id': 'UMC', 'value': 'Upper middle income'},
            'region': {'id': 'EAS', 'value': 'East Asia & Pacific'}
        },
        {
            'id': 'WLD',
            'value': 'World',
            'incomeLevel': None,  # This should be filtered out
            'region': None
        }
    ]
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.get_countries_list()
    
    assert len(result) == 2
    assert {'code': 'CHN', 'name': 'China'} in result
    assert {'code': 'USA', 'name': 'United States'} in result


@patch('data_fetcher.wb.economy.list')
def test_get_countries_list_error(mock_list):
    """Test error handling in countries list retrieval."""
    mock_list.side_effect = Exception("API Error")
    
    fetcher = WorldBankDataFetcher()
    with pytest.raises(Exception) as exc_info:
        fetcher.get_countries_list()
    
    assert "API Error" in str(exc_info.value)


def test_convenience_functions():
    """Test convenience functions with mocked methods."""
    with patch.object(WorldBankDataFetcher, 'get_countries_list') as mock_countries:
        mock_countries.return_value = [{'code': 'USA', 'name': 'United States'}]
        result = get_countries()
        assert result == [{'code': 'USA', 'name': 'United States'}]
    
    with patch.object(WorldBankDataFetcher, 'get_data_for_api') as mock_data:
        mock_data.return_value = {'data': [], 'metadata': {}}
        result = get_co2_gdp_data(['USA'], 2020, 2021)
        mock_data.assert_called_once_with(['USA'], 2020, 2021)
        assert result == {'data': [], 'metadata': {}}


@patch.object(WorldBankDataFetcher, 'fetch_indicator_data')
def test_fetch_co2_data(mock_fetch):
    """Test CO2 data fetching."""
    mock_fetch.return_value = pd.DataFrame({
        'country_code': ['USA'],
        'country_name': ['United States'],
        'year': [2020],
        'value': [15.5]
    })
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.fetch_co2_data(['USA'], 2020, 2021)
    
    mock_fetch.assert_called_once_with('EN.ATM.CO2E.PC', ['USA'], 2020, 2021)
    assert len(result) == 1
    assert result.iloc[0]['value'] == 15.5


@patch.object(WorldBankDataFetcher, 'fetch_indicator_data')
def test_fetch_gdp_data(mock_fetch):
    """Test GDP data fetching."""
    mock_fetch.return_value = pd.DataFrame({
        'country_code': ['USA'],
        'country_name': ['United States'],
        'year': [2020],
        'value': [63593.44]
    })
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.fetch_gdp_data(['USA'], 2020, 2021)
    
    mock_fetch.assert_called_once_with('NY.GDP.PCAP.CD', ['USA'], 2020, 2021)
    assert len(result) == 1
    assert result.iloc[0]['value'] == 63593.44


@patch.object(WorldBankDataFetcher, 'fetch_co2_data')
@patch.object(WorldBankDataFetcher, 'fetch_gdp_data')
def test_fetch_combined_data_success(mock_gdp, mock_co2):
    """Test successful combined data fetching."""
    mock_co2.return_value = pd.DataFrame({
        'country_code': ['USA', 'CHN'],
        'country_name': ['United States', 'China'],
        'year': [2020, 2020],
        'value': [15.5, 7.4]
    })
    
    mock_gdp.return_value = pd.DataFrame({
        'country_code': ['USA', 'CHN'],
        'country_name': ['United States', 'China'],
        'year': [2020, 2020],
        'value': [63593.44, 10500.40]
    })
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.fetch_combined_data(['USA', 'CHN'], 2020, 2021)
    
    assert len(result) == 2
    assert 'co2_emissions' in result.columns
    assert 'gdp_per_capita' in result.columns
    assert result.iloc[0]['co2_emissions'] == 15.5
    assert result.iloc[0]['gdp_per_capita'] == 63593.44


@patch.object(WorldBankDataFetcher, 'fetch_combined_data')
def test_get_data_for_api_success(mock_combined):
    """Test API data formatting."""
    mock_combined.return_value = pd.DataFrame({
        'country_code': ['USA', 'CHN'],
        'country_name': ['United States', 'China'],
        'year': [2020, 2020],
        'co2_emissions': [15.5, 7.4],
        'gdp_per_capita': [63593.44, 10500.40]
    })
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.get_data_for_api(['USA', 'CHN'], 2020, 2021)
    
    assert 'data' in result
    assert 'metadata' in result
    assert len(result['data']) == 2
    assert result['metadata']['total_records'] == 2
    assert result['metadata']['countries'] == 2
    assert 'indicators' in result['metadata']


@patch.object(WorldBankDataFetcher, 'fetch_combined_data')
def test_get_data_for_api_empty(mock_combined):
    """Test API data formatting with empty dataset."""
    mock_combined.return_value = pd.DataFrame()
    
    fetcher = WorldBankDataFetcher()
    result = fetcher.get_data_for_api()
    
    assert result['data'] == []
    assert result['metadata']['total_records'] == 0
    assert result['metadata']['countries'] == 0


def test_year_range_validation():
    """Test year range handling."""
    from datetime import datetime
    current_year = datetime.now().year
    
    fetcher = WorldBankDataFetcher()
    with patch.object(fetcher, 'fetch_indicator_data') as mock_fetch:
        mock_fetch.return_value = pd.DataFrame()
        fetcher.fetch_co2_data(start_year=2020, end_year=None)
        
        # Should call with current year as end_year
        args, kwargs = mock_fetch.call_args
        assert args[3] == current_year  # end_year parameter


if __name__ == '__main__':
    pytest.main([__file__, '-v'])