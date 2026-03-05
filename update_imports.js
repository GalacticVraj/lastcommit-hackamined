const fs = require('fs');
const file = 'frontend/src/pages/DashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(\import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';\, '');
fs.writeFileSync(file, content);
console.log('Removed unused import');
