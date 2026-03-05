const fs = require('fs');

const indexCssPath = 'frontend/src/index.css';
let css = fs.readFileSync(indexCssPath, 'utf8');

// Additional styles for perfect matching
const additions = 

/* Extra specific layout styling for the dashboard */
.header-actions-glass {
    display: flex;
    gap: 12px;
}
.icon-btn-glass {
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 12px;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #0d0c0b;
}
.icon-btn-glass:hover { background: rgba(255,255,255,0.6); }

/* Custom utility */
.txt-light { color: rgba(13,12,11, 0.5); }
.txt-dark { color: #0D0C0B; font-weight: 500; }
.txt-white { color: #FFF; }
.card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 2rem; }

/* Sub elements */
.orders-stats { display: flex; justify-content: space-between; align-items: flex-end; }
.orders-stats > div { display: flex; flex-direction: column; }
.number-big { font-size: 2.5rem; font-weight: 600; line-height: 1; }
.label-small { font-size: 0.85rem; font-weight: 500; opacity: 0.8; }

.stock-chart-area { display: flex; gap: 20px; align-items: center; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; margin-bottom: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }

.reorder-img {
    width: 100%; height: 180px;
    background: radial-gradient(circle, #333, #000);
    border-radius: 16px; margin-bottom: 16px;
    display:flex; justify-content:center; align-items:center; color:#fff;
    box-shadow: inset 0 -40px 40px -20px #000;
}
;

if(!css.includes('reorder-img')) {
    fs.appendFileSync(indexCssPath, additions);
}


const dashboardCode = import { useState, useEffect } from 'react';
import { LayoutGrid, Home, ClipboardList, Briefcase, Calendar, CheckSquare, FileText, List, Search, MapPin, Map, Package, Activity, ArrowUpRight, ArrowDownRight, Settings, Image as ImageIcon, SlidersHorizontal, UploadCloud, ChevronDown, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    // For styling like the specific image:
    return (
        <div style={{ padding: '0 40px', height: '100%', overflowY:'auto' }}>
            {/* Top Bar */}
            <div className="top-bar-glass">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{width:'32px', height:'32px', background:'#000', clipPath:'polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%, 20% 50%)'}}></div>
                    <h1>Inventory</h1>
                </div>
                <div className="header-actions-glass">
                    <div className="pill-glass">
                        <MapPin size={16} /> Storage: 51 Port Terminal Blvd # 12, Bayonne, NJ <ChevronDown size={14}/>
                    </div>
                    <div className="pill-glass">
                        <Calendar size={16} /> Month <ChevronDown size={14}/>
                    </div>
                    <button className="icon-btn-glass"><LayoutGrid size={18} /></button>
                    <button className="icon-btn-glass"><Settings size={18} /></button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-row-1">
                    {/* Orders Card */}
                    <div className="glass-card-yellow">
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <div className="card-title">Orders</div>
                            <button className="icon-btn-glass" style={{background:'transparent', border:'none', position:'relative', right:'-10px', top:'-10px'}}><SlidersHorizontal size={18}/></button>
                        </div>
                        <div className="orders-stats">
                            <div style={{paddingBottom:'10px'}}>
                                <div className="number-big">1</div>
                                <div className="label-small">Overdue</div>
                            </div>
                            <div style={{paddingBottom:'30px'}}>
                                <div className="number-big" style={{fontSize:'1.5rem'}}>3</div>
                                <div className="label-small">Returns</div>
                            </div>
                            <div style={{paddingBottom:'60px'}}>
                                <div className="number-big" style={{fontSize:'1.8rem'}}>14</div>
                                <div className="label-small">In progress</div>
                            </div>
                            <div>
                                <div className="number-big">94</div>
                                <div className="label-small">Completed</div>
                                <div style={{width:'40px', height:'100px', background:'linear-gradient(to top, #000, #F5ED31)', borderRadius:'8px', marginTop:'8px'}}></div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="glass-card-orange">
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <div className="card-title">Stock</div>
                            <button className="icon-btn-glass" style={{background:'transparent', border:'none', position:'relative', right:'-10px', top:'-10px'}}><SlidersHorizontal size={18}/></button>
                        </div>
                        <div className="stock-chart-area">
                            <div>
                                <div className="legend-item"><div className="dot" style={{background:'#0D0C0B'}}></div> In stock</div>
                                <div className="legend-item txt-light"><div className="dot" style={{border:'1px dashed #0D0C0B'}}></div> Out of stock</div>
                                <div className="legend-item" style={{opacity:0.8}}><div className="dot" style={{background:'#0D0C0B', opacity:0.5}}></div> Low stock</div>
                                <div className="legend-item"><div className="dot" style={{background:'#000'}}></div> Dead stock</div>
                            </div>
                            <div style={{flex:1, position:'relative', height:'140px'}}>
                               <div style={{position:'absolute', top:0, right:30, background:'#F5ED31', padding:'8px 16px', borderRadius:'20px', fontWeight:600}}>134</div>
                               <div style={{width:'120px', height:'120px', borderRadius:'50%', background:'linear-gradient(45deg, #0D0C0B 60%, rgba(13,12,11,0.5) 60%, rgba(13,12,11,0.5) 85%, transparent 85%)', position:'absolute', bottom:-10, right:-10}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reorders Card */}
                <div className="dashboard-widget-reorders glass-card-dark">
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                        <div className="card-title" style={{margin:0}}>Reorders</div>
                        <div style={{display:'flex', gap:'8px'}}>
                            <div style={{width:'24px', height:'2px', background:'#fff', opacity:0.3, marginTop:'10px'}}></div>
                            <button className="icon-btn-glass" style={{background:'rgba(255,255,255,0.1)', border:'none'}}><ArrowUpRight size={16} color="#fff"/></button>
                        </div>
                    </div>
                    
                    <div className="glass-glass" style={{background:'rgba(255,255,255,0.05)', padding:'16px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)'}}>
                        <div className="reorder-img">
                            <ImageIcon size={48} opacity={0.5}/>
                        </div>
                        <div style={{display:'flex', gap:'10px', marginBottom:'16px'}}>
                            <span style={{background:'#FF934F', color:'#000', fontSize:'0.75rem', padding:'4px 12px', borderRadius:'12px', fontWeight:600}}>? High demand</span>
                        </div>
                        <h3 style={{margin:0, fontSize:'1.4rem', fontWeight:500}}>Jaunt 360 Camera</h3>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'8px'}}>
                            <p style={{fontSize:'0.85rem', color:'rgba(255,255,255,0.6)', margin:0}}>Estimated demand: 100+ &nbsp;|&nbsp; In stock: 13</p>
                            <button style={{background:'#F5ED31', border:'none', borderRadius:'12px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                                <ClipboardList size={20} color="#000"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-row-2">
                    {/* Logistics Card */}
                    <div className="glass-glass" style={{padding:'20px', display:'flex', flexDirection:'column', gap:'10px', height:'200px'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                             <div className="card-title" style={{margin:0}}>Logistics</div>
                             <button className="icon-btn-glass" style={{background:'transparent', border:'none'}}><ArrowUpRight size={18}/></button>
                        </div>
                        <div style={{flex:1, position:'relative'}}>
                            {/* Fake Map Elements */}
                            <div style={{position:'absolute', top:'20px', left:'10px', background:'#F5ED31', padding:'10px', borderRadius:'8px', clipPath:'polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%)', width:'100px', height:'60px'}}></div>
                            <div style={{position:'absolute', top:'50px', right:'50px', background:'#FF934F', opacity:0.8, padding:'10px', borderRadius:'8px', width:'60px', height:'70px', clipPath:'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'}}></div>
                            
                            {/* Lines */}
                            <svg width="100%" height="100%" style={{position:'absolute', top:0, left:0}}>
                                <path d="M 120 50 Q 200 40 250 80 T 380 70" fill="transparent" stroke="#0D0C0B" strokeWidth="1" strokeDasharray="4 4" />
                            </svg>
                            
                            <div style={{position:'absolute', top:'60px', left:'230px', background:'#FF934F', color:'#000', fontSize:'0.75rem', padding:'4px 12px', borderRadius:'12px', fontWeight:600, display:'flex', gap:'4px', alignItems:'center'}}>
                                <Activity size={12}/> Delay +2d
                            </div>

                            <div style={{position:'absolute', bottom:0, left:0}}>
                                <p style={{fontSize:'0.85rem', fontWeight:600, marginBottom:'8px'}}>Delivery is delayed</p>
                                <div style={{display:'flex', gap:'8px', background:'rgba(255,255,255,0.5)', padding:'8px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.6)'}}>
                                    <div style={{width:30, height:30, background:'#000', borderRadius:'6px'}}></div>
                                    <div style={{width:30, height:30, background:'#333', borderRadius:'6px'}}></div>
                                    <div style={{width:30, height:30, background:'#555', borderRadius:'6px'}}></div>
                                    <div style={{background:'rgba(255,255,255,0.5)', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', display:'flex', alignItems:'center'}}>+32</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="products-table-glass">
                    <div className="filter-bar">
                        <div style={{position:'relative', width:'300px'}}>
                            <Search size={18} style={{position:'absolute', left:15, top:10, color:'#888'}}/>
                            <input type="text" placeholder="Search" className="search-input" style={{paddingLeft:40, width:'100%', boxSizing:'border-box'}}/>
                        </div>
                        <div className="pill-glass" style={{background:'rgba(255,255,255,0.5)', border:'none'}}>Category <ChevronDown size={14}/></div>
                        <div className="pill-glass" style={{background:'rgba(255,255,255,0.5)', border:'none'}}>Supplier <ChevronDown size={14}/></div>
                        <div className="pill-glass" style={{background:'rgba(255,255,255,0.5)', border:'none'}}>Storage <ChevronDown size={14}/></div>
                        
                        <div style={{flex:1}}></div>
                        
                        <button className="icon-btn-glass" style={{background:'rgba(255,255,255,0.5)', border:'none'}}><SlidersHorizontal size={18}/></button>
                        <button className="icon-btn-glass" style={{background:'rgba(255,255,255,0.5)', border:'none'}}><UploadCloud size={18}/></button>
                        <button className="icon-btn-glass" style={{background:'#F5ED31', border:'none'}}><ClipboardList size={18}/></button>
                    </div>

                    <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
                        <thead>
                            <tr style={{color:'rgba(13,12,11,0.5)', fontSize:'0.85rem'}}>
                                <th style={{padding:'10px', width:'40px'}}></th>
                                <th style={{padding:'10px'}}>Product</th>
                                <th style={{padding:'10px'}}>Supplier</th>
                                <th style={{padding:'10px'}}>Category</th>
                                <th style={{padding:'10px'}}>Cost</th>
                                <th style={{padding:'10px'}}>On hand</th>
                                <th style={{padding:'10px'}}>On hand value</th>
                                <th style={{padding:'10px'}}>Demand</th>
                                <th style={{padding:'10px'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
                                <td style={{padding:'10px'}}><div style={{width:16, height:16, border:'2px solid rgba(0,0,0,0.1)', borderRadius:4}}></div></td>
                                <td style={{padding:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
                                    <div style={{width:40, height:40, background:'#000', borderRadius:8}}></div>
                                    <div>
                                        <div style={{fontWeight:600}}>Jaunt 360 Camera</div>
                                        <div style={{fontSize:'0.75rem', color:'rgba(0,0,0,0.5)'}}>SKU 8372631832</div>
                                    </div>
                                </td>
                                <td style={{padding:'10px'}}>Jaunt</td>
                                <td style={{padding:'10px'}}>Electronics</td>
                                <td style={{padding:'10px'}}>.00</td>
                                <td style={{padding:'10px'}}>13</td>
                                <td style={{padding:'10px'}}>,325.00</td>
                                <td style={{padding:'10px'}}>
                                     <span style={{background:'#FF934F', color:'#000', fontSize:'0.75rem', padding:'4px 10px', borderRadius:'12px', fontWeight:600}}>? High</span>
                                </td>
                                <td style={{padding:'10px', color:'rgba(0,0,0,0.3)'}}>...</td>
                            </tr>
                            <tr>
                                <td style={{padding:'10px'}}><div style={{width:16, height:16, border:'2px solid rgba(0,0,0,0.1)', borderRadius:4}}></div></td>
                                <td style={{padding:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
                                    <div style={{width:40, height:40, background:'#0D0C0B', borderRadius:8}}></div>
                                    <div>
                                        <div style={{fontWeight:600}}>Theta S Close Up 360</div>
                                        <div style={{fontSize:'0.75rem', color:'rgba(0,0,0,0.5)'}}>SKU 32887753</div>
                                    </div>
                                </td>
                                <td style={{padding:'10px'}}>Theta</td>
                                <td style={{padding:'10px'}}>Electronics</td>
                                <td style={{padding:'10px'}}>.00</td>
                                <td style={{padding:'10px'}}>103</td>
                                <td style={{padding:'10px'}}>,775.00</td>
                                <td style={{padding:'10px'}}>
                                     <span style={{background:'#2563EB', color:'#fff', fontSize:'0.75rem', padding:'4px 10px', borderRadius:'12px', fontWeight:600}}>? Low</span>
                                </td>
                                <td style={{padding:'10px', color:'rgba(0,0,0,0.3)'}}>...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
;
fs.writeFileSync('frontend/src/pages/DashboardPage.jsx', dashboardCode);

const layoutCode = import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, Briefcase, Calendar, CheckSquare, FileText, List } from 'lucide-react';

export default function AppLayout() {
    const mainNav = [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/clipboard', icon: ClipboardList, label: 'Clipboard' },
        { to: '/cases', icon: Briefcase, label: 'Cases' },
        { to: '/calendar', icon: Calendar, label: 'Calendar' },
        { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { to: '/files', icon: FileText, label: 'Files' },
        { to: '/list', icon: List, label: 'List' },
    ];

    return (
        <div className="app-layout-glass">
            <aside className="sidebar-glass glass-glass">
                <div className="logo-container" style={{display:'grid', gridTemplateColumns:'auto auto', gap:4}}>
                    <div style={{width:6, height:6, background:'#000', borderRadius:2}}></div>
                    <div style={{width:6, height:6, background:'#000', borderRadius:2}}></div>
                    <div style={{width:6, height:6, background:'#000', borderRadius:2}}></div>
                    <div style={{width:6, height:6, background:'#000', borderRadius:2}}></div>
                </div>
                <nav className="nav-items">
                    {mainNav.map((item, idx) => (
                        <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) => \
av-link \\}
                            title={item.label}
                        >
                            <item.icon size={22} strokeWidth={isActive => isActive && item.to === '/' ? 2.5 : 2} />
                        </NavLink>
                    ))}
                </nav>
                
                <div style={{marginTop: 'auto', display:'flex', flexDirection:'column', gap:'16px', alignItems:'center'}}>
                    <div style={{position:'relative'}}>
                         <div style={{width:40, height:40, borderRadius:'16px', overflow:'hidden', background:'#d1d1d1'}}>
                             <img src="https://i.pravatar.cc/100?img=5" style={{width:'100%'}} alt="User"/>
                         </div>
                    </div>
                </div>
            </aside>

            <main className="main-content-glass glass-glass">
                <Outlet />
            </main>
        </div>
    );
}
;
fs.writeFileSync('frontend/src/layouts/AppLayout.jsx', layoutCode);
console.log('Update Complete.');
