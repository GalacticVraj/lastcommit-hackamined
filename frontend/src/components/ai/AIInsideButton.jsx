import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../lib/api';
import useUIStore from '../../lib/uiStore';
import AISummaryPanel from './AISummaryPanel';

export default function AIInsideButton() {
    const [unreadCount, setUnreadCount] = useState(0);
    const { aiPanelOpen, setAiPanelOpen } = useUIStore();
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await api.get('/ai/unread-count');
                if (res.data?.success) {
                    setUnreadCount(res.data.total_count);
                }
            } catch (error) {
                console.error('Failed to fetch AI unread count');
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOpen = () => {
        setAiPanelOpen(true);
        setUnreadCount(0);
    };

    return (
        <>
            {/* Tooltip */}
            {isHovered && !aiPanelOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '28px',
                    background: '#1C1A17',
                    color: '#FAFAF8',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    animation: 'fadeIn 150ms ease-out',
                    whiteSpace: 'nowrap'
                }}>
                    AI Insights
                </div>
            )}

            <button
                onClick={handleOpen}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isHovered ? '#F5924A' : '#E8720C',
                    border: '2px solid #C9860A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    cursor: 'pointer',
                    boxShadow: isHovered ? '0 6px 24px rgba(232, 114, 12, 0.40)' : '0 4px 16px rgba(232, 114, 12, 0.30)',
                    transition: 'all 200ms ease',
                    transform: aiPanelOpen ? 'translateX(100px)' : (isHovered ? 'scale(1.08)' : 'scale(1)'),
                    opacity: aiPanelOpen ? 0 : 1,
                    pointerEvents: aiPanelOpen ? 'none' : 'auto'
                }}
            >
                {/* Pulse Ring */}
                <span className="ai-pulse-ring" />

                <Sparkles size={22} color="white" strokeWidth={2} />

                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#C0392B',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #FAFAF8',
                        padding: '0 4px'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .ai-pulse-ring {
                    position: absolute;
                    inset: -2px;
                    border-radius: 50%;
                    border: 2px solid rgba(232, 114, 12, 0.25);
                    opacity: 0;
                    animation: aiPulse 3s infinite;
                    pointer-events: none;
                }
                @keyframes aiPulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.6); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `}</style>

            <AISummaryPanel />
        </>
    );
}
