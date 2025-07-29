import { useState, useEffect, useCallback } from "react";
import {inventoryService} from "../api";

const SearchSuggestions = ({ value, onChange }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchSuggestions = useCallback(async (searchTerm, signal) => {
        if (searchTerm.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const response = await inventoryService.getProductSuggestions(searchTerm, signal);
            setSuggestions(response.data);
        } catch (error) {
            if (error.name !== 'CanceledError') {
                console.error("Error fetching suggestions:", error);
            }
        }
        }, []);

        useEffect(() => {
            const controller = new AbortController();

            if (value) {
                setShowSuggestions(true);
                const debounceTime = setTimeout(() => {
                    fetchSuggestions(value, controller.signal);
                }, 300);
                return () => clearTimeout(debounceTime);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }

            return () => controller.abort();
        }, [value, fetchSuggestions]);

        const handleSuggestionClick = (suggestion) => {
            onChange(suggestion);
            setShowSuggestions(false);
        };

        const handleSearchSubmit = (e) => {
            e.preventDefault();
            setShowSuggestions(false);
        };

        return (
            <div>
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Search products..."
                        onFocus={() => value && setShowSuggestions(true)}
                    />
                </form>
                {showSuggestions && suggestions.length > 0 && (
                    <ul>
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
};

export default SearchSuggestions;
