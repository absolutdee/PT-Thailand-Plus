// searchUtils.js - Utility functions for search functionality

import Fuse from 'fuse.js';
import { debounce } from 'lodash';

class SearchUtils {
    constructor() {
        this.defaultFuseOptions = {
            includeScore: true,
            includeMatches: true,
            threshold: 0.3,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 2,
            shouldSort: true,
            findAllMatches: false,
            keys: [],
        };

        this.searchHistory = [];
        this.maxHistoryItems = 10;
        this.popularSearches = new Map();
    }

    // Create search instance
    createSearchInstance(data, options = {}) {
        const fuseOptions = {
            ...this.defaultFuseOptions,
            ...options,
        };

        return new Fuse(data, fuseOptions);
    }

    // Basic search
    search(data, query, options = {}) {
        if (!query || query.trim() === '') {
            return data;
        }

        const searchInstance = this.createSearchInstance(data, options);
        const results = searchInstance.search(query.trim());

        // Track search
        this.trackSearch(query);

        // Return items with scores
        return results.map(result => ({
            ...result.item,
            _score: result.score,
            _matches: result.matches,
        }));
    }

    // Advanced search with filters
    advancedSearch(data, searchParams) {
        const {
            query,
            filters = {},
            sortBy,
            sortOrder = 'asc',
            page = 1,
            limit = 20,
            fuzzyOptions = {},
        } = searchParams;

        let results = [...data];

        // Apply text search if query exists
        if (query && query.trim() !== '') {
            const searchResults = this.search(results, query, fuzzyOptions);
            results = searchResults;
        }

        // Apply filters
        results = this.applyFilters(results, filters);

        // Apply sorting
        if (sortBy) {
            results = this.sortResults(results, sortBy, sortOrder);
        }

        // Calculate pagination
        const totalResults = results.length;
        const totalPages = Math.ceil(totalResults / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // Apply pagination
        const paginatedResults = results.slice(startIndex, endIndex);

        return {
            results: paginatedResults,
            pagination: {
                page,
                limit,
                totalResults,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            query,
            filters,
        };
    }

    // Apply filters to results
    applyFilters(data, filters) {
        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (value === undefined || value === null || value === '') {
                    continue;
                }

                const itemValue = this.getNestedValue(item, key);

                // Handle different filter types
                if (Array.isArray(value)) {
                    // Multiple values (OR condition)
                    if (!value.includes(itemValue)) {
                        return false;
                    }
                } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                    // Range filter
                    if (itemValue < value.min || itemValue > value.max) {
                        return false;
                    }
                } else if (typeof value === 'object' && value.operator) {
                    // Custom operator
                    if (!this.applyOperator(itemValue, value.operator, value.value)) {
                        return false;
                    }
                } else {
                    // Exact match
                    if (itemValue !== value) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    // Apply custom operators
    applyOperator(itemValue, operator, filterValue) {
        switch (operator) {
            case 'eq':
                return itemValue === filterValue;
            case 'ne':
                return itemValue !== filterValue;
            case 'gt':
                return itemValue > filterValue;
            case 'gte':
                return itemValue >= filterValue;
            case 'lt':
                return itemValue < filterValue;
            case 'lte':
                return itemValue <= filterValue;
            case 'contains':
                return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'startsWith':
                return String(itemValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'endsWith':
                return String(itemValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case 'in':
                return Array.isArray(filterValue) && filterValue.includes(itemValue);
            case 'notIn':
                return Array.isArray(filterValue) && !filterValue.includes(itemValue);
            default:
                return true;
        }
    }

    // Sort results
    sortResults(data, sortBy, sortOrder = 'asc') {
        const sorted = [...data].sort((a, b) => {
            const aValue = this.getNestedValue(a, sortBy);
            const bValue = this.getNestedValue(b, sortBy);

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // Compare values
            if (typeof aValue === 'string') {
                return sortOrder === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortOrder === 'asc' 
                ? aValue - bValue
                : bValue - aValue;
        });

        return sorted;
    }

    // Get nested value from object
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Create search index for better performance
    createSearchIndex(data, fields) {
        const index = new Map();

        data.forEach((item, itemIndex) => {
            fields.forEach(field => {
                const value = this.getNestedValue(item, field);
                if (value) {
                    const tokens = this.tokenize(String(value));
                    tokens.forEach(token => {
                        if (!index.has(token)) {
                            index.set(token, new Set());
                        }
                        index.get(token).add(itemIndex);
                    });
                }
            });
        });

        return {
            index,
            data,
            search: (query) => this.searchWithIndex(index, data, query),
        };
    }

    // Search using index
    searchWithIndex(index, data, query) {
        const tokens = this.tokenize(query);
        const resultIndices = new Set();

        tokens.forEach(token => {
            const matches = index.get(token);
            if (matches) {
                matches.forEach(index => resultIndices.add(index));
            }
        });

        return Array.from(resultIndices).map(index => data[index]);
    }

    // Tokenize text for indexing
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    // Highlight search results
    highlightMatches(text, query, options = {}) {
        const {
            className = 'highlight',
            tag = 'mark',
            caseSensitive = false,
        } = options;

        if (!query || !text) return text;

        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(`(${this.escapeRegex(query)})`, flags);

        return text.replace(regex, `<${tag} class="${className}">$1</${tag}>`);
    }

    // Escape regex special characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Get search suggestions
    async getSearchSuggestions(query, data, options = {}) {
        const {
            maxSuggestions = 5,
            fields = [],
            minLength = 2,
        } = options;

        if (query.length < minLength) {
            return [];
        }

        // Get matches
        const searchOptions = {
            keys: fields,
            threshold: 0.2,
            limit: maxSuggestions * 2, // Get more to filter duplicates
        };

        const results = this.search(data, query, searchOptions);

        // Extract unique suggestions
        const suggestions = new Set();
        results.forEach(result => {
            fields.forEach(field => {
                const value = this.getNestedValue(result, field);
                if (value && String(value).toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(String(value));
                }
            });
        });

        return Array.from(suggestions).slice(0, maxSuggestions);
    }

    // Track search for analytics
    trackSearch(query) {
        // Add to search history
        this.addToSearchHistory(query);

        // Update popular searches
        const count = this.popularSearches.get(query) || 0;
        this.popularSearches.set(query, count + 1);

        // Trigger analytics event
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search', {
                search_term: query,
            });
        }
    }

    // Add to search history
    addToSearchHistory(query) {
        // Remove if already exists
        const existingIndex = this.searchHistory.indexOf(query);
        if (existingIndex > -1) {
            this.searchHistory.splice(existingIndex, 1);
        }

        // Add to beginning
        this.searchHistory.unshift(query);

        // Limit history size
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory.pop();
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        }
    }

    // Get search history
    getSearchHistory() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('searchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        }
        return this.searchHistory;
    }

    // Clear search history
    clearSearchHistory() {
        this.searchHistory = [];
        if (typeof window !== 'undefined') {
            localStorage.removeItem('searchHistory');
        }
    }

    // Get popular searches
    getPopularSearches(limit = 10) {
        return Array.from(this.popularSearches.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    // Create debounced search
    createDebouncedSearch(searchFunction, delay = 300) {
        return debounce(searchFunction, delay);
    }

    // Search with spell correction
    searchWithSpellCorrection(data, query, options = {}) {
        // First try exact search
        let results = this.search(data, query, options);

        // If no results, try with higher threshold
        if (results.length === 0) {
            const fuzzyOptions = {
                ...options,
                threshold: 0.6,
            };
            results = this.search(data, query, fuzzyOptions);

            // Mark as corrected
            results = results.map(result => ({
                ...result,
                _corrected: true,
            }));
        }

        return results;
    }

    // Export search results
    exportSearchResults(results, format = 'csv') {
        switch (format) {
            case 'csv':
                return this.exportToCSV(results);
            case 'json':
                return this.exportToJSON(results);
            case 'xlsx':
                return this.exportToExcel(results);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Export to CSV
    exportToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');

        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value;
            }).join(',');
        });

        return `${csvHeaders}\n${csvRows.join('\n')}`;
    }

    // Export to JSON
    exportToJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    // Export to Excel (placeholder - would need xlsx library)
    exportToExcel(data) {
        console.warn('Excel export requires xlsx library');
        return data;
    }

    // Calculate search relevance score
    calculateRelevanceScore(item, query, fields) {
        let score = 0;
        const queryLower = query.toLowerCase();

        fields.forEach(field => {
            const value = String(this.getNestedValue(item, field) || '').toLowerCase();
            
            // Exact match
            if (value === queryLower) {
                score += 10;
            }
            // Starts with query
            else if (value.startsWith(queryLower)) {
                score += 5;
            }
            // Contains query
            else if (value.includes(queryLower)) {
                score += 2;
            }
            // Word match
            else if (value.split(/\s+/).some(word => word === queryLower)) {
                score += 3;
            }
        });

        return score;
    }
}

// Export singleton instance
const searchUtils = new SearchUtils();
export default searchUtils;

// Export individual functions
export const {
    search,
    advancedSearch,
    createSearchInstance,
    applyFilters,
    sortResults,
    highlightMatches,
    getSearchSuggestions,
    trackSearch,
    getSearchHistory,
    clearSearchHistory,
    getPopularSearches,
    createDebouncedSearch,
    searchWithSpellCorrection,
    exportSearchResults,
    createSearchIndex,
} = searchUtils;
