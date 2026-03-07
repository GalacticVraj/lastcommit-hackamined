import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopProgressBar — YouTube-style thin blue bar at the top of the screen
 * that animates on every route change.
 */
export default function TopProgressBar() {
    const location = useLocation();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timer = useRef(null);
    const done = useRef(false);

    const start = () => {
        done.current = false;
        setVisible(true);
        setProgress(0);
        let p = 0;
        timer.current = setInterval(() => {
            if (done.current) { clearInterval(timer.current); return; }
            p = p < 70 ? p + Math.random() * 10 : p < 90 ? p + Math.random() * 2 : p;
            setProgress(Math.min(p, 90));
        }, 100);
    };

    const finish = () => {
        done.current = true;
        clearInterval(timer.current);
        setProgress(100);
        setTimeout(() => { setVisible(false); setProgress(0); }, 400);
    };

    useEffect(() => {
        start();
        const t = setTimeout(finish, 500); // auto-finish after 500ms max
        return () => { clearTimeout(t); clearInterval(timer.current); };
    }, [location.pathname]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
            zIndex: 9999, pointerEvents: 'none'
        }}>
            <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #2563EB, #06b6d4)',
                transition: progress === 100 ? 'width 0.2s ease, opacity 0.4s ease' : 'width 0.15s ease',
                opacity: progress === 100 ? 0 : 1,
                boxShadow: '0 0 8px rgba(37,99,235,0.8)',
                borderRadius: '0 3px 3px 0'
            }} />
        </div>
    );
}
