const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── 1. Permissions ──
    const modules = [
        { module: 'sales', actions: ['view', 'customer.create', 'customer.edit', 'customer.delete', 'inquiry.create', 'inquiry.edit', 'quotation.create', 'quotation.edit', 'so.create', 'so.edit', 'dispatch.create', 'invoice.create', 'receipt.create'] },
        { module: 'purchase', actions: ['view', 'vendor.create', 'vendor.edit', 'vendor.delete', 'indent.create', 'po.create', 'grn.create', 'iqc.create', 'receipt.create', 'bill.create', 'payment.create'] },
        { module: 'production', actions: ['view', 'product.create', 'product.edit', 'bom.create', 'routecard.create', 'routecard.edit', 'issue.create', 'transfer.create', 'report.create', 'job.create', 'challan.create', 'bill.create'] },
        { module: 'simulation', actions: ['view', 'run'] },
        { module: 'finance', actions: ['view', 'voucher.create', 'reconciliation.create', 'cc.create'] },
        { module: 'hr', actions: ['view', 'employee.create', 'employee.edit', 'salary.create', 'advance.create'] },
        { module: 'quality', actions: ['view', 'iqc.create', 'mts.create', 'pqc.create', 'pdi.create', 'qrd.create'] },
        { module: 'warehouse', actions: ['view', 'create', 'transfer.create', 'srv.create'] },
        { module: 'statutory', actions: ['view', 'gst.create', 'tds.create', 'tcs.create', 'cheque.create', 'challan.create'] },
        { module: 'logistics', actions: ['view', 'transporter.create', 'order.create', 'bill.create'] },
        { module: 'contractors', actions: ['view', 'worker.create', 'salary.create', 'advance.create'] },
        { module: 'maintenance', actions: ['view', 'tool.create', 'chart.create', 'calibration.create', 'rectification.create'] },
        { module: 'assets', actions: ['view', 'create', 'addition.create', 'allocation.create', 'sale.create', 'depreciation.create'] },
    ];

    const allPermissions = [];
    for (const mod of modules) {
        for (const action of mod.actions) {
            allPermissions.push({
                module: mod.module,
                action,
                description: `${mod.module}.${action}`
            });
        }
    }
    // Add wildcard
    allPermissions.push({ module: '*', action: '*', description: 'Super Admin - All permissions' });

    for (const p of allPermissions) {
        await prisma.permission.upsert({
            where: { module_action: { module: p.module, action: p.action } },
            update: {},
            create: p
        });
    }
    console.log(`✅ Created ${allPermissions.length} permissions`);

    // ── 2. Roles ──
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: {},
        create: { name: 'Super Admin', description: 'Full access to all modules' }
    });

    const salesRole = await prisma.role.upsert({
        where: { name: 'Sales Manager' },
        update: {},
        create: { name: 'Sales Manager', description: 'Sales module access' }
    });

    // Assign all permissions to Super Admin
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: superAdminRole.id, permissionId: perm.id }
        });
    }

    // Assign sales permissions
    const salesPerms = allPerms.filter(p => p.module === 'sales');
    for (const perm of salesPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: salesRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: salesRole.id, permissionId: perm.id }
        });
    }
    console.log('✅ Roles created and permissions assigned');

    // ── 3. Users ──
    const hashedPw = await bcrypt.hash('password', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@erp.com' },
        update: {},
        create: { name: 'Super Admin', email: 'admin@erp.com', password: hashedPw }
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
        update: {},
        create: { userId: admin.id, roleId: superAdminRole.id }
    });

    const salesUser = await prisma.user.upsert({
        where: { email: 'sales@erp.com' },
        update: {},
        create: { name: 'Sales User', email: 'sales@erp.com', password: hashedPw }
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: salesUser.id, roleId: salesRole.id } },
        update: {},
        create: { userId: salesUser.id, roleId: salesRole.id }
    });
    console.log('✅ Users created: admin@erp.com / password, sales@erp.com / password');

    // ── 4. Products (Raw Materials + Finished Goods) ──
    const rawMaterials = [
        { code: 'RM-STEEL-001', name: 'Steel Sheet (1.2mm)', category: 'Raw Material', unit: 'KG', hsnCode: '7208', gstPercent: 18, currentStock: 5000, lastPurchasePrice: 85, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-STEEL-002', name: 'Steel Rod (10mm)', category: 'Raw Material', unit: 'KG', hsnCode: '7214', gstPercent: 18, currentStock: 3000, lastPurchasePrice: 72, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-RUBBER-001', name: 'Rubber Sheet (5mm)', category: 'Raw Material', unit: 'KG', hsnCode: '4002', gstPercent: 18, currentStock: 1500, lastPurchasePrice: 120, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-PAINT-001', name: 'Industrial Paint (White)', category: 'Raw Material', unit: 'LTR', hsnCode: '3208', gstPercent: 28, currentStock: 800, lastPurchasePrice: 350, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-BOLT-001', name: 'Hex Bolt M10', category: 'Raw Material', unit: 'PCS', hsnCode: '7318', gstPercent: 18, currentStock: 20000, lastPurchasePrice: 5, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-WIRE-001', name: 'Copper Wire (2.5mm)', category: 'Raw Material', unit: 'MTR', hsnCode: '7408', gstPercent: 18, currentStock: 2000, lastPurchasePrice: 45, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-GLASS-001', name: 'Tempered Glass (6mm)', category: 'Raw Material', unit: 'SQM', hsnCode: '7007', gstPercent: 18, currentStock: 500, lastPurchasePrice: 680, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
        { code: 'RM-ALUM-001', name: 'Aluminium Sheet (2mm)', category: 'Raw Material', unit: 'KG', hsnCode: '7606', gstPercent: 18, currentStock: 2500, lastPurchasePrice: 195, manHoursPerUnit: 0, machineHoursPerUnit: 0 },
    ];

    const finishedGoods = [
        { code: 'FG-ALTO-001', name: 'Alto Assembly Unit', category: 'Finished Good', unit: 'PCS', hsnCode: '8703', gstPercent: 28, currentStock: 15, lastPurchasePrice: 0, productionDays: 14, manHoursPerUnit: 120, machineHoursPerUnit: 80 },
        { code: 'FG-SWIFT-001', name: 'Swift Assembly Unit', category: 'Finished Good', unit: 'PCS', hsnCode: '8703', gstPercent: 28, currentStock: 8, lastPurchasePrice: 0, productionDays: 18, manHoursPerUnit: 160, machineHoursPerUnit: 100 },
        { code: 'FG-BALENO-001', name: 'Baleno Assembly Unit', category: 'Finished Good', unit: 'PCS', hsnCode: '8703', gstPercent: 28, currentStock: 5, lastPurchasePrice: 0, productionDays: 20, manHoursPerUnit: 180, machineHoursPerUnit: 120 },
        { code: 'FG-PUMP-001', name: 'Industrial Pump Set', category: 'Finished Good', unit: 'PCS', hsnCode: '8413', gstPercent: 18, currentStock: 25, lastPurchasePrice: 0, productionDays: 7, manHoursPerUnit: 24, machineHoursPerUnit: 12 },
        { code: 'FG-MOTOR-001', name: 'Electric Motor 5HP', category: 'Finished Good', unit: 'PCS', hsnCode: '8501', gstPercent: 18, currentStock: 30, lastPurchasePrice: 0, productionDays: 5, manHoursPerUnit: 16, machineHoursPerUnit: 8 },
    ];

    const allProducts = [];
    for (const p of [...rawMaterials, ...finishedGoods]) {
        const prod = await prisma.product.upsert({ where: { code: p.code }, update: {}, create: { ...p, createdBy: admin.id } });
        allProducts.push(prod);
    }
    console.log(`✅ Created ${allProducts.length} products`);

    // ── 5. BOMs ──
    const alto = allProducts.find(p => p.code === 'FG-ALTO-001');
    const swift = allProducts.find(p => p.code === 'FG-SWIFT-001');
    const baleno = allProducts.find(p => p.code === 'FG-BALENO-001');
    const steel1 = allProducts.find(p => p.code === 'RM-STEEL-001');
    const steel2 = allProducts.find(p => p.code === 'RM-STEEL-002');
    const rubber = allProducts.find(p => p.code === 'RM-RUBBER-001');
    const paint = allProducts.find(p => p.code === 'RM-PAINT-001');
    const bolts = allProducts.find(p => p.code === 'RM-BOLT-001');
    const wire = allProducts.find(p => p.code === 'RM-WIRE-001');
    const glass = allProducts.find(p => p.code === 'RM-GLASS-001');
    const alum = allProducts.find(p => p.code === 'RM-ALUM-001');

    const bomDefs = [
        {
            productId: alto.id, bomNo: 'BOM-ALTO-001', items: [
                { productId: steel1.id, qtyPerUnit: 150, unit: 'KG', processName: 'Cutting' },
                { productId: steel2.id, qtyPerUnit: 50, unit: 'KG', processName: 'Welding' },
                { productId: rubber.id, qtyPerUnit: 20, unit: 'KG', processName: 'Molding' },
                { productId: paint.id, qtyPerUnit: 8, unit: 'LTR', processName: 'Painting' },
                { productId: bolts.id, qtyPerUnit: 200, unit: 'PCS', processName: 'Assembly' },
                { productId: wire.id, qtyPerUnit: 50, unit: 'MTR', processName: 'Wiring' },
                { productId: glass.id, qtyPerUnit: 4, unit: 'SQM', processName: 'Glazing' },
            ]
        },
        {
            productId: swift.id, bomNo: 'BOM-SWIFT-001', items: [
                { productId: steel1.id, qtyPerUnit: 200, unit: 'KG', processName: 'Cutting' },
                { productId: steel2.id, qtyPerUnit: 70, unit: 'KG', processName: 'Welding' },
                { productId: rubber.id, qtyPerUnit: 25, unit: 'KG', processName: 'Molding' },
                { productId: paint.id, qtyPerUnit: 10, unit: 'LTR', processName: 'Painting' },
                { productId: bolts.id, qtyPerUnit: 250, unit: 'PCS', processName: 'Assembly' },
                { productId: wire.id, qtyPerUnit: 60, unit: 'MTR', processName: 'Wiring' },
                { productId: glass.id, qtyPerUnit: 5, unit: 'SQM', processName: 'Glazing' },
                { productId: alum.id, qtyPerUnit: 30, unit: 'KG', processName: 'Body Work' },
            ]
        },
        {
            productId: baleno.id, bomNo: 'BOM-BALENO-001', items: [
                { productId: steel1.id, qtyPerUnit: 220, unit: 'KG', processName: 'Cutting' },
                { productId: steel2.id, qtyPerUnit: 80, unit: 'KG', processName: 'Welding' },
                { productId: rubber.id, qtyPerUnit: 30, unit: 'KG', processName: 'Molding' },
                { productId: paint.id, qtyPerUnit: 12, unit: 'LTR', processName: 'Painting' },
                { productId: bolts.id, qtyPerUnit: 300, unit: 'PCS', processName: 'Assembly' },
                { productId: wire.id, qtyPerUnit: 75, unit: 'MTR', processName: 'Wiring' },
                { productId: glass.id, qtyPerUnit: 6, unit: 'SQM', processName: 'Glazing' },
                { productId: alum.id, qtyPerUnit: 40, unit: 'KG', processName: 'Body Work' },
            ]
        },
    ];

    for (const bom of bomDefs) {
        await prisma.bOMHeader.upsert({
            where: { bomNo: bom.bomNo },
            update: {},
            create: { productId: bom.productId, bomNo: bom.bomNo, createdBy: admin.id, items: { create: bom.items } }
        });
    }
    console.log('✅ BOMs created (Alto, Swift, Baleno)');

    // ── 6. Routing Tables ──
    const routingDefs = [
        {
            productId: alto.id, ops: [
                { operationNo: 10, operationName: 'Press Shop', machineName: 'Hydraulic Press', manHours: 20, machineHours: 15 },
                { operationNo: 20, operationName: 'Weld Shop', machineName: 'MIG Welder', manHours: 30, machineHours: 20 },
                { operationNo: 30, operationName: 'Paint Shop', machineName: 'Paint Booth', manHours: 25, machineHours: 15 },
                { operationNo: 40, operationName: 'Assembly', machineName: 'Assembly Line', manHours: 35, machineHours: 25 },
                { operationNo: 50, operationName: 'PDI', machineName: 'Inspection Bay', manHours: 10, machineHours: 5 },
            ]
        },
        {
            productId: swift.id, ops: [
                { operationNo: 10, operationName: 'Press Shop', machineName: 'Hydraulic Press', manHours: 25, machineHours: 18 },
                { operationNo: 20, operationName: 'Weld Shop', machineName: 'MIG Welder', manHours: 40, machineHours: 25 },
                { operationNo: 30, operationName: 'Paint Shop', machineName: 'Paint Booth', manHours: 30, machineHours: 18 },
                { operationNo: 40, operationName: 'Assembly', machineName: 'Assembly Line', manHours: 50, machineHours: 30 },
                { operationNo: 50, operationName: 'PDI', machineName: 'Inspection Bay', manHours: 15, machineHours: 9 },
            ]
        },
        {
            productId: baleno.id, ops: [
                { operationNo: 10, operationName: 'Press Shop', machineName: 'Hydraulic Press', manHours: 30, machineHours: 22 },
                { operationNo: 20, operationName: 'Weld Shop', machineName: 'MIG Welder', manHours: 45, machineHours: 28 },
                { operationNo: 30, operationName: 'Paint Shop', machineName: 'Paint Booth', manHours: 35, machineHours: 22 },
                { operationNo: 40, operationName: 'Assembly', machineName: 'Assembly Line', manHours: 55, machineHours: 38 },
                { operationNo: 50, operationName: 'PDI', machineName: 'Inspection Bay', manHours: 15, machineHours: 10 },
            ]
        },
    ];

    for (const r of routingDefs) {
        for (const op of r.ops) {
            await prisma.routingTable.create({ data: { productId: r.productId, ...op } });
        }
    }
    console.log('✅ Routing tables created');

    // ── 7. Customers ──
    const customers = [
        { name: 'Tata Motors Ltd', gstin: '27AAACT2727Q1ZZ', stateCode: '27', address: 'Pimpri, Pune', city: 'Pune', state: 'Maharashtra', contactPerson: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@tatamotors.com', creditPeriod: 45 },
        { name: 'Maruti Suzuki India', gstin: '07AABCM1234A1Z5', stateCode: '07', address: 'Gurgaon', city: 'Gurgaon', state: 'Haryana', contactPerson: 'Amit Shah', phone: '9876543211', email: 'amit@maruti.com', creditPeriod: 30 },
        { name: 'Mahindra & Mahindra', gstin: '27AAECM1234A1ZV', stateCode: '27', address: 'Kandivali, Mumbai', city: 'Mumbai', state: 'Maharashtra', contactPerson: 'Suresh Patel', phone: '9876543212', email: 'suresh@mahindra.com', creditPeriod: 60 },
        { name: 'Ashok Leyland', gstin: '33AAECA1234B1ZC', stateCode: '33', address: 'Ennore, Chennai', city: 'Chennai', state: 'Tamil Nadu', contactPerson: 'Vishnu Rao', phone: '9876543213', email: 'vishnu@ashokleyland.com', creditPeriod: 30 },
        { name: 'Bajaj Auto', gstin: '24AABCB9999A1Z5', stateCode: '24', address: 'Akurdi, Pune', city: 'Pune', state: 'Maharashtra', contactPerson: 'Deepak Joshi', phone: '9876543214', email: 'deepak@bajajauto.com', creditPeriod: 45 },
        { name: 'Hero MotoCorp', gstin: '06AAACH1234E1ZW', stateCode: '06', address: 'Dharuhera', city: 'Dharuhera', state: 'Haryana', contactPerson: 'Manoj Singh', phone: '9876543215', email: 'manoj@heromotocorp.com', creditPeriod: 30 },
        { name: 'TVS Motor Company', gstin: '33AAACT5678F1ZK', stateCode: '33', address: 'Hosur', city: 'Hosur', state: 'Tamil Nadu', contactPerson: 'Ramesh Iyer', phone: '9876543216', email: 'ramesh@tvsmotor.com', creditPeriod: 45 },
        { name: 'Force Motors', gstin: '27AABCF1234G1ZJ', stateCode: '27', address: 'Akurdi, Pune', city: 'Pune', state: 'Maharashtra', contactPerson: 'Vinay Deshmukh', phone: '9876543217', email: 'vinay@forcemotors.com', creditPeriod: 30 },
        { name: 'Eicher Motors', gstin: '06AABCE1234H1ZI', stateCode: '06', address: 'Pithampur, Indore', city: 'Indore', state: 'Madhya Pradesh', contactPerson: 'Karan Malhotra', phone: '9876543218', email: 'karan@eichermotors.com', creditPeriod: 45 },
        { name: 'SML Isuzu', gstin: '03AABCS1234I1ZH', stateCode: '03', address: 'Nawanshahr', city: 'Nawanshahr', state: 'Punjab', contactPerson: 'Gurpreet Singh', phone: '9876543219', email: 'gurpreet@smlisuzu.com', creditPeriod: 60 },
    ];

    for (const c of customers) {
        await prisma.customer.upsert({ where: { id: customers.indexOf(c) + 1 }, update: {}, create: { ...c, createdBy: admin.id } });
    }
    console.log('✅ 10 Customers created');

    // ── 8. Vendors ──
    const vendors = [
        { name: 'Steel Authority of India (SAIL)', gstin: '09AABCS5432A1ZG', stateCode: '09', address: 'Ranchi', city: 'Ranchi', state: 'Jharkhand', contactPerson: 'Pradeep', phone: '8765432100', email: 'pradeep@sail.com' },
        { name: 'Tata Steel Ltd', gstin: '20AABCT9876B1ZF', stateCode: '20', address: 'Jamshedpur', city: 'Jamshedpur', state: 'Jharkhand', contactPerson: 'Rahul', phone: '8765432101', email: 'rahul@tatasteel.com' },
        { name: 'Hindalco Industries', gstin: '09AABCH1234C1ZE', stateCode: '09', address: 'Renukoot', city: 'Renukoot', state: 'Uttar Pradesh', contactPerson: 'Nitin', phone: '8765432102', email: 'nitin@hindalco.com' },
        { name: 'Asian Paints Ltd', gstin: '27AABCA5678D1ZD', stateCode: '27', address: 'Andheri, Mumbai', city: 'Mumbai', state: 'Maharashtra', contactPerson: 'Sanjay', phone: '8765432103', email: 'sanjay@asianpaints.com' },
        { name: 'Supreme Rubber', gstin: '24AABCS9012E1ZC', stateCode: '24', address: 'Vadodara', city: 'Vadodara', state: 'Gujarat', contactPerson: 'Jayesh', phone: '8765432104', email: 'jayesh@supremerubber.com' },
    ];

    for (const v of vendors) {
        await prisma.vendor.upsert({ where: { id: vendors.indexOf(v) + 1 }, update: {}, create: { ...v, createdBy: admin.id } });
    }
    console.log('✅ 5 Vendors created');

    // ── 9. Employees ──
    const employees = [
        { empCode: 'EMP001', name: 'Rakesh Sharma', designation: 'Production Manager', department: 'Production', mobile: '9111111111', basicSalary: 45000 },
        { empCode: 'EMP002', name: 'Priya Nair', designation: 'Quality Engineer', department: 'Quality', mobile: '9111111112', basicSalary: 35000 },
        { empCode: 'EMP003', name: 'Vikram Yadav', designation: 'Store Manager', department: 'Stores', mobile: '9111111113', basicSalary: 30000 },
        { empCode: 'EMP004', name: 'Anita Desai', designation: 'HR Executive', department: 'HR', mobile: '9111111114', basicSalary: 32000 },
        { empCode: 'EMP005', name: 'Mohammed Farooq', designation: 'Accounts Manager', department: 'Finance', mobile: '9111111115', basicSalary: 40000 },
    ];

    for (const e of employees) {
        const emp = await prisma.employee.upsert({ where: { empCode: e.empCode }, update: {}, create: { ...e, joiningDate: new Date('2023-04-01'), createdBy: admin.id } });
        await prisma.employeeSalaryStructure.create({
            data: { employeeId: emp.id, effectiveDate: new Date('2023-04-01'), basic: e.basicSalary, hra: +(e.basicSalary * 0.4).toFixed(0), da: +(e.basicSalary * 0.1).toFixed(0), allowances: 3000, createdBy: admin.id }
        }).catch(() => { }); // ignore if already exists
    }
    console.log('✅ 5 Employees created with salary structures');

    // ── 10. Warehouses ──
    await prisma.warehouse.upsert({ where: { id: 1 }, update: {}, create: { name: 'Main Store', address: 'Building A, Ground Floor', managerName: 'Vikram Yadav', createdBy: admin.id } });
    await prisma.warehouse.upsert({ where: { id: 2 }, update: {}, create: { name: 'Raw Material Store', address: 'Building B', managerName: 'Rajesh Pandey', createdBy: admin.id } });
    await prisma.warehouse.upsert({ where: { id: 3 }, update: {}, create: { name: 'Finished Goods Store', address: 'Building C', managerName: 'Sunil Kumar', createdBy: admin.id } });
    console.log('✅ 3 Warehouses created');

    // ── 11. Doc Number Sequences ──
    const seqs = ['INQ', 'QT', 'SO', 'INV', 'DA', 'RV', 'MI', 'PO', 'GRN', 'MR', 'PB', 'PV', 'BOM', 'RC', 'MIS', 'MTA', 'JO', 'JC', 'JB', 'JV', 'ST', 'SRV', 'TO', 'FB'];
    for (const s of seqs) {
        await prisma.docSequence.upsert({ where: { docType: s }, update: {}, create: { docType: s, prefix: s, year: 2026, lastNo: 0 } });
    }
    console.log('✅ Document number sequences initialised');

    // ── 12. GST Master ──
    const gstEntries = [
        { hsnCode: '7208', description: 'Flat-rolled products of iron/steel', igstPercent: 18, cgstPercent: 9, sgstPercent: 9 },
        { hsnCode: '7214', description: 'Bars and rods of iron/steel', igstPercent: 18, cgstPercent: 9, sgstPercent: 9 },
        { hsnCode: '4002', description: 'Synthetic rubber', igstPercent: 18, cgstPercent: 9, sgstPercent: 9 },
        { hsnCode: '3208', description: 'Paints and varnishes', igstPercent: 28, cgstPercent: 14, sgstPercent: 14 },
        { hsnCode: '7318', description: 'Screws, bolts, nuts', igstPercent: 18, cgstPercent: 9, sgstPercent: 9 },
        { hsnCode: '8703', description: 'Motor cars', igstPercent: 28, cgstPercent: 14, sgstPercent: 14 },
    ];
    for (const g of gstEntries) {
        await prisma.gSTMaster.upsert({ where: { hsnCode: g.hsnCode }, update: {}, create: g });
    }
    console.log('✅ GST Master entries created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('   Login: admin@erp.com / password');
    console.log('   Login: sales@erp.com / password');
}

main()
    .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
