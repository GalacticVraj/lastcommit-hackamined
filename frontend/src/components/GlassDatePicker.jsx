import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './GlassDatePicker.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function GlassDatePicker({ 
    value, 
    onChange, 
    placeholder = 'Select date...', 
    className = '',
    disabled = false 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const selectedDate = value ? new Date(value) : null;

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

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 8,
                left: rect.left,
                zIndex: 99999
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleSelectDate = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const formatted = newDate.toISOString().split('T')[0];
        onChange({ target: { value: formatted } });
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        onChange({ target: { value: formatted } });
        setViewDate(today);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange({ target: { value: '' } });
        setIsOpen(false);
    };

    const formatDisplayDate = () => {
        if (!selectedDate) return placeholder;
        return selectedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const prevMonthDays = getDaysInMonth(year, month - 1);
        
        const days = [];
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="glass-date-day other-month">
                    {prevMonthDays - i}
                </div>
            );
        }
        
        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year;
            const isToday = today.getDate() === day && 
                today.getMonth() === month && 
                today.getFullYear() === year;
            
            days.push(
                <div 
                    key={day} 
                    className={`glass-date-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleSelectDate(day)}
                >
                    {day}
                </div>
            );
        }
        
        // Next month days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push(
                <div key={`next-${i}`} className="glass-date-day other-month">
                    {i}
                </div>
            );
        }
        
        return days;
    };

    const dropdown = isOpen && createPortal(
        <div ref={dropdownRef} className="glass-date-dropdown" style={dropdownStyle}>
            <div className="glass-date-header">
                <button className="glass-date-nav" onClick={handlePrevMonth}>
                    <ChevronLeft size={18} />
                </button>
                <span className="glass-date-month-year">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button className="glass-date-nav" onClick={handleNextMonth}>
                    <ChevronRight size={18} />
                </button>
            </div>
            <div className="glass-date-weekdays">
                {DAYS.map(d => <div key={d} className="glass-date-weekday">{d}</div>)}
            </div>
            <div className="glass-date-grid">
                {renderCalendar()}
            </div>
            <div className="glass-date-footer">
                <button className="glass-date-action" onClick={handleClear}>Clear</button>
                <button className="glass-date-action primary" onClick={handleToday}>Today</button>
            </div>
        </div>,
        document.body
    );

    return (
        <div 
            ref={containerRef}
            className={`glass-date-picker ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        >
            <div 
                ref={triggerRef}
                className="glass-date-trigger"
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <Calendar size={18} className="glass-date-icon" />
                <span className={`glass-date-value ${!selectedDate ? 'placeholder' : ''}`}>
                    {formatDisplayDate()}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`glass-date-arrow ${isOpen ? 'rotated' : ''}`} 
                />
            </div>
            {dropdown}
        </div>
    );
}
