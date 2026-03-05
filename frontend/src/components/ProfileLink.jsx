/**
 * ProfileLink — renders any name as a blue clickable link that navigates
 * to the entity's profile page.
 *
 * Props:
 *   id     number | string   — entity ID
 *   name   string            — display text
 *   type   'customer' | 'vendor' | 'employee' | 'salesman'
 *   style  object            — optional extra styles
 */
import { useNavigate } from 'react-router-dom';

export default function ProfileLink({ id, name, type, style = {} }) {
    const navigate = useNavigate();

    if (!id || !name) return <span>{name || '—'}</span>;

    return (
        <button
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${type}/${id}`); }}
            style={{
                background: 'none', border: 'none', padding: '0',
                color: 'var(--blue-light)', fontWeight: 500,
                cursor: 'pointer', fontSize: 'inherit',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
                transition: 'color 0.15s',
                ...style
            }}
            onMouseEnter={e => e.target.style.color = '#93C5FD'}
            onMouseLeave={e => e.target.style.color = 'var(--blue-light)'}
        >
            {name}
        </button>
    );
}
