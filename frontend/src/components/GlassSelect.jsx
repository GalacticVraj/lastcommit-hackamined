import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import './GlassSelect.css';

export default function GlassSelect({ 
    value, 
    onChange, 
    options = [], 
    placeholder = 'Select...', 
    className = '',
    disabled = false 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedInContainer = containerRef.current?.contains(e.target);
            const clickedInDropdown = dropdownRef.current?.contains(e.target);
            if (!clickedInContainer && !clickedInDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Position dropdown when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                zIndex: 99999
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedIdx = options.findIndex(opt => opt.value === value);
            if (selectedIdx >= 0) {
                setHighlightedIndex(selectedIdx);
                const item = listRef.current.children[selectedIdx];
                item?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [isOpen, value, options]);

    const handleKeyDown = (e) => {
        if (disabled) return;
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    handleSelect(options[highlightedIndex].value);
                } else {
                    setIsOpen(!isOpen);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev => 
                        prev < options.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (val) => {
        onChange({ target: { value: val } });
        setIsOpen(false);
    };

    const dropdown = isOpen && createPortal(
        <div ref={dropdownRef} className="glass-select-dropdown" style={dropdownStyle}>
            <ul ref={listRef} className="glass-select-options">
                {options.map((opt, idx) => (
                    <li
                        key={opt.value}
                        className={`glass-select-option ${opt.value === value ? 'selected' : ''} ${idx === highlightedIndex ? 'highlighted' : ''}`}
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                        <span>{opt.label}</span>
                        {opt.value === value && <Check size={16} />}
                    </li>
                ))}
            </ul>
        </div>,
        document.body
    );

    return (
        <div 
            ref={containerRef}
            className={`glass-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
        >
            <div 
                ref={triggerRef}
                className="glass-select-trigger"
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`glass-select-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`glass-select-arrow ${isOpen ? 'rotated' : ''}`} 
                />
            </div>
            {dropdown}
        </div>
    );
}
