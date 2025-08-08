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
            <div className="relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Search products..."
                        onFocus={() => value && setShowSuggestions(true)}
                        className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                    />
                </form>
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg z-10">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
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
