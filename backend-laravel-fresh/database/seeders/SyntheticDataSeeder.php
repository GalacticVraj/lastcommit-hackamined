<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Inquiry;
use App\Models\InquiryItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SaleOrder;
use App\Models\SaleOrderItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\JournalVoucher;
use App\Models\VoucherJournal;
use App\Models\VoucherPaymentReceipt;
use App\Models\VoucherContra;
use App\Models\VoucherGST;
use App\Models\Employee;
use App\Models\SalaryHead;
use App\Models\EmployeeSalaryStructure;
use App\Models\EmployeeSalarySheet;
use App\Models\EmployeeAdvance;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GRN;
use App\Models\GRNItem;
use App\Models\PurchaseBill;
use App\Models\SalesReceiptVoucher;
use App\Models\BOMHeader;
use App\Models\ProductionRouteCard;
use App\Models\ProductionReport;
use App\Models\JobOrder;
use App\Models\BankReconciliation;
use App\Models\CreditCardStatement;
use App\Services\AutoNumber;
use Illuminate\Support\Facades\Schema;

class SyntheticDataSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════════════
        // CUSTOMERS
        // ══════════════════════════════════════════════════════════════════════
        $customers = [
            ['name' => 'Tata Motors Ltd', 'gstin' => '27AAACT2727Q1ZZ', 'address' => 'Pimpri, Pune', 'city' => 'Pune', 'state' => 'Maharashtra', 'contactPerson' => 'Rajesh Kumar', 'phone' => '9876543210'],
            ['name' => 'Mahindra & Mahindra', 'gstin' => '27AAACM4839G1ZZ', 'address' => 'Kandivali, Mumbai', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'contactPerson' => 'Suresh Patel', 'phone' => '9876543211'],
            ['name' => 'Bajaj Auto Ltd', 'gstin' => '27AAACB7814N1ZZ', 'address' => 'Akurdi, Pune', 'city' => 'Pune', 'state' => 'Maharashtra', 'contactPerson' => 'Amit Shah', 'phone' => '9876543212'],
            ['name' => 'Hero MotoCorp', 'gstin' => '06AAACH5753R1ZZ', 'address' => 'Dharuhera', 'city' => 'Rewari', 'state' => 'Haryana', 'contactPerson' => 'Vikram Singh', 'phone' => '9876543213'],
            ['name' => 'Ashok Leyland', 'gstin' => '33AAACA3955E1ZH', 'address' => 'Ennore', 'city' => 'Chennai', 'state' => 'Tamil Nadu', 'contactPerson' => 'Ravi Shankar', 'phone' => '9876543214'],
        ];
        
        foreach ($customers as $c) {
            Customer::firstOrCreate(['name' => $c['name']], array_merge($c, ['isActive' => true]));
        }
        $customer = Customer::where('name', 'Tata Motors Ltd')->first();
        echo "✅ Created " . count($customers) . " customers\n";

        // ══════════════════════════════════════════════════════════════════════
        // VENDORS
        // ══════════════════════════════════════════════════════════════════════
        $vendors = [
            ['name' => 'Steel Authority of India', 'gstin' => '07AAACS6765E1ZG', 'address' => 'Lodi Road', 'city' => 'New Delhi', 'state' => 'Delhi', 'contactPerson' => 'Rahul Verma', 'phone' => '9988776655'],
            ['name' => 'Tata Steel Ltd', 'gstin' => '20AAACT2727Q1ZY', 'address' => 'Bistupur', 'city' => 'Jamshedpur', 'state' => 'Jharkhand', 'contactPerson' => 'Ankit Gupta', 'phone' => '9988776656'],
            ['name' => 'Asian Paints Ltd', 'gstin' => '27AAACA9001E1ZX', 'address' => 'Andheri East', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'contactPerson' => 'Priya Sharma', 'phone' => '9988776657'],
            ['name' => 'Havells India Ltd', 'gstin' => '09AAACH0875G1ZE', 'address' => 'Sector 32', 'city' => 'Noida', 'state' => 'Uttar Pradesh', 'contactPerson' => 'Deepak Kumar', 'phone' => '9988776658'],
            ['name' => 'JSW Steel Ltd', 'gstin' => '29AAACJ0901G1ZF', 'address' => 'Toranagallu', 'city' => 'Bellary', 'state' => 'Karnataka', 'contactPerson' => 'Sunil Reddy', 'phone' => '9988776659'],
        ];

        foreach ($vendors as $v) {
            Vendor::firstOrCreate(['name' => $v['name']], array_merge($v, ['isActive' => true]));
        }
        $vendor = Vendor::where('name', 'Steel Authority of India')->first();
        echo "✅ Created " . count($vendors) . " vendors\n";

        // ══════════════════════════════════════════════════════════════════════
        // PRODUCTS
        // ══════════════════════════════════════════════════════════════════════
        $products = [
            ['code' => 'FG-ALTO-001', 'name' => 'Alto Assembly Unit', 'category' => 'Finished Good', 'unit' => 'PCS', 'gstPercent' => 28, 'currentStock' => 15],
            ['code' => 'FG-SWIFT-001', 'name' => 'Swift Assembly Unit', 'category' => 'Finished Good', 'unit' => 'PCS', 'gstPercent' => 28, 'currentStock' => 8],
            ['code' => 'FG-BALENO-001', 'name' => 'Baleno Assembly Unit', 'category' => 'Finished Good', 'unit' => 'PCS', 'gstPercent' => 28, 'currentStock' => 5],
            ['code' => 'RM-STEEL-001', 'name' => 'Steel Sheet 1.2mm', 'category' => 'Raw Material', 'unit' => 'KG', 'gstPercent' => 18, 'currentStock' => 5000],
            ['code' => 'RM-STEEL-002', 'name' => 'Steel Rod 10mm', 'category' => 'Raw Material', 'unit' => 'KG', 'gstPercent' => 18, 'currentStock' => 3000],
            ['code' => 'RM-RUBBER-001', 'name' => 'Rubber Sheet 5mm', 'category' => 'Raw Material', 'unit' => 'KG', 'gstPercent' => 18, 'currentStock' => 1500],
            ['code' => 'RM-PAINT-001', 'name' => 'Industrial Paint White', 'category' => 'Raw Material', 'unit' => 'LTR', 'gstPercent' => 28, 'currentStock' => 800],
            ['code' => 'RM-BOLT-001', 'name' => 'Hex Bolt M10', 'category' => 'Raw Material', 'unit' => 'PCS', 'gstPercent' => 18, 'currentStock' => 20000],
            ['code' => 'RM-WIRE-001', 'name' => 'Copper Wire 2.5mm', 'category' => 'Raw Material', 'unit' => 'MTR', 'gstPercent' => 18, 'currentStock' => 2000],
        ];

        foreach ($products as $p) {
            Product::firstOrCreate(['code' => $p['code']], $p);
        }
        $p1 = Product::where('code', 'FG-ALTO-001')->first();
        $p2 = Product::where('code', 'FG-SWIFT-001')->first();
        echo "✅ Created " . count($products) . " products\n";

        // ══════════════════════════════════════════════════════════════════════
        // EMPLOYEES (Comprehensive test data with all fields - 40 employees)
        // ══════════════════════════════════════════════════════════════════════
        $employees = [
            // Production Department (12 employees - largest)
            ['empCode' => 'EMP001', 'name' => 'Amit Kumar', 'designation' => 'Production Manager', 'department' => 'Production', 'mobile' => '9876541001', 'email' => 'amit.kumar@techmicra.com', 'panNo' => 'ABCPK1234A', 'aadharNo' => '123456781001', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345001', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 65000, 'hra' => 26000, 'da' => 6500, 'otherAllowances' => 8000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP009', 'name' => 'Rajesh Gupta', 'designation' => 'CNC Operator', 'department' => 'Production', 'mobile' => '9876541009', 'email' => 'rajesh.gupta@techmicra.com', 'panNo' => 'YZARG3456I', 'aadharNo' => '123456781009', 'bankName' => 'Bank of Baroda', 'bankAccount' => '50100012345009', 'ifscCode' => 'BARB0001234', 'basicSalary' => 28000, 'hra' => 11200, 'da' => 2800, 'otherAllowances' => 2000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP015', 'name' => 'Karthik Subramanian', 'designation' => 'Maintenance Engineer', 'department' => 'Production', 'mobile' => '9876541015', 'email' => 'karthik.s@techmicra.com', 'panNo' => 'QRSKS7890O', 'aadharNo' => '123456781015', 'bankName' => 'Indian Bank', 'bankAccount' => '50100012345015', 'ifscCode' => 'IDIB0001234', 'basicSalary' => 38000, 'hra' => 15200, 'da' => 3800, 'otherAllowances' => 4000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP016', 'name' => 'Manoj Tiwari', 'designation' => 'Machine Operator', 'department' => 'Production', 'mobile' => '9876541016', 'email' => 'manoj.tiwari@techmicra.com', 'panNo' => 'TUVMT1234P', 'aadharNo' => '123456781016', 'bankName' => 'SBI', 'bankAccount' => '50100012345016', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 24000, 'hra' => 9600, 'da' => 2400, 'otherAllowances' => 1800, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP017', 'name' => 'Ravi Shankar', 'designation' => 'Shift Supervisor', 'department' => 'Production', 'mobile' => '9876541017', 'email' => 'ravi.shankar@techmicra.com', 'panNo' => 'WXYZRS5678Q', 'aadharNo' => '123456781017', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345017', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 35000, 'hra' => 14000, 'da' => 3500, 'otherAllowances' => 3500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP018', 'name' => 'Gopal Krishnan', 'designation' => 'Assembly Technician', 'department' => 'Production', 'mobile' => '9876541018', 'email' => 'gopal.k@techmicra.com', 'panNo' => 'ABCGK9012R', 'aadharNo' => '123456781018', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345018', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 26000, 'hra' => 10400, 'da' => 2600, 'otherAllowances' => 2000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP019', 'name' => 'Santosh Yadav', 'designation' => 'Welding Operator', 'department' => 'Production', 'mobile' => '9876541019', 'email' => 'santosh.yadav@techmicra.com', 'panNo' => 'DEFSY3456S', 'aadharNo' => '123456781019', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345019', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 23000, 'hra' => 9200, 'da' => 2300, 'otherAllowances' => 1500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP020', 'name' => 'Vinod Sharma', 'designation' => 'Production Planner', 'department' => 'Production', 'mobile' => '9876541020', 'email' => 'vinod.sharma@techmicra.com', 'panNo' => 'GHIVS7890T', 'aadharNo' => '123456781020', 'bankName' => 'Kotak Bank', 'bankAccount' => '50100012345020', 'ifscCode' => 'KKBK0001234', 'basicSalary' => 42000, 'hra' => 16800, 'da' => 4200, 'otherAllowances' => 5000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP021', 'name' => 'Prakash Das', 'designation' => 'Lathe Operator', 'department' => 'Production', 'mobile' => '9876541021', 'email' => 'prakash.das@techmicra.com', 'panNo' => 'JKLPD1234U', 'aadharNo' => '123456781021', 'bankName' => 'SBI', 'bankAccount' => '50100012345021', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 22000, 'hra' => 8800, 'da' => 2200, 'otherAllowances' => 1500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP022', 'name' => 'Ramesh Babu', 'designation' => 'Grinding Operator', 'department' => 'Production', 'mobile' => '9876541022', 'email' => 'ramesh.babu@techmicra.com', 'panNo' => 'MNORB5678V', 'aadharNo' => '123456781022', 'bankName' => 'Canara Bank', 'bankAccount' => '50100012345022', 'ifscCode' => 'CNRB0001234', 'basicSalary' => 21000, 'hra' => 8400, 'da' => 2100, 'otherAllowances' => 1400, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP023', 'name' => 'Sunil Jain', 'designation' => 'Tool Room Incharge', 'department' => 'Production', 'mobile' => '9876541023', 'email' => 'sunil.jain@techmicra.com', 'panNo' => 'PQRSJ9012W', 'aadharNo' => '123456781023', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345023', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 32000, 'hra' => 12800, 'da' => 3200, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP024', 'name' => 'Ajay Patil', 'designation' => 'Helper', 'department' => 'Production', 'mobile' => '9876541024', 'email' => 'ajay.patil@techmicra.com', 'panNo' => 'TUVAP3456X', 'aadharNo' => '123456781024', 'bankName' => 'Bank of Baroda', 'bankAccount' => '50100012345024', 'ifscCode' => 'BARB0001234', 'basicSalary' => 18000, 'hra' => 7200, 'da' => 1800, 'otherAllowances' => 1200, 'pfApplicable' => true, 'esicApplicable' => true],

            // Quality Department (6 employees)
            ['empCode' => 'EMP002', 'name' => 'Priya Singh', 'designation' => 'Quality Engineer', 'department' => 'Quality', 'mobile' => '9876541002', 'email' => 'priya.singh@techmicra.com', 'panNo' => 'DEFPS5678B', 'aadharNo' => '123456781002', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345002', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 45000, 'hra' => 18000, 'da' => 4500, 'otherAllowances' => 4000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP010', 'name' => 'Meena Iyer', 'designation' => 'Quality Inspector', 'department' => 'Quality', 'mobile' => '9876541010', 'email' => 'meena.iyer@techmicra.com', 'panNo' => 'BCDMI7890J', 'aadharNo' => '123456781010', 'bankName' => 'Canara Bank', 'bankAccount' => '50100012345010', 'ifscCode' => 'CNRB0001234', 'basicSalary' => 28000, 'hra' => 11200, 'da' => 2800, 'otherAllowances' => 2200, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP025', 'name' => 'Naveen Kumar', 'designation' => 'QC Manager', 'department' => 'Quality', 'mobile' => '9876541025', 'email' => 'naveen.kumar@techmicra.com', 'panNo' => 'WXYNK7890Y', 'aadharNo' => '123456781025', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345025', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 55000, 'hra' => 22000, 'da' => 5500, 'otherAllowances' => 6000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP026', 'name' => 'Lakshmi Narayanan', 'designation' => 'Lab Technician', 'department' => 'Quality', 'mobile' => '9876541026', 'email' => 'lakshmi.n@techmicra.com', 'panNo' => 'ABCLN1234Z', 'aadharNo' => '123456781026', 'bankName' => 'SBI', 'bankAccount' => '50100012345026', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 26000, 'hra' => 10400, 'da' => 2600, 'otherAllowances' => 2000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP027', 'name' => 'Shreya Kapoor', 'designation' => 'Metrology Specialist', 'department' => 'Quality', 'mobile' => '9876541027', 'email' => 'shreya.kapoor@techmicra.com', 'panNo' => 'DEFSK5678A', 'aadharNo' => '123456781027', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345027', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 34000, 'hra' => 13600, 'da' => 3400, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP028', 'name' => 'Rahul Mehta', 'designation' => 'Quality Auditor', 'department' => 'Quality', 'mobile' => '9876541028', 'email' => 'rahul.mehta@techmicra.com', 'panNo' => 'GHIRM9012B', 'aadharNo' => '123456781028', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345028', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 38000, 'hra' => 15200, 'da' => 3800, 'otherAllowances' => 3500, 'pfApplicable' => true, 'esicApplicable' => false],

            // Sales Department (8 employees)
            ['empCode' => 'EMP003', 'name' => 'Rahul Sharma', 'designation' => 'Sales Executive', 'department' => 'Sales', 'mobile' => '9876541003', 'email' => 'rahul.sharma@techmicra.com', 'panNo' => 'GHIRS9012C', 'aadharNo' => '123456781003', 'bankName' => 'SBI', 'bankAccount' => '50100012345003', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 35000, 'hra' => 14000, 'da' => 3500, 'otherAllowances' => 12000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP011', 'name' => 'Deepak Verma', 'designation' => 'Sales Manager', 'department' => 'Sales', 'mobile' => '9876541011', 'email' => 'deepak.verma@techmicra.com', 'panNo' => 'EFGDV1234K', 'aadharNo' => '123456781011', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345011', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 70000, 'hra' => 28000, 'da' => 7000, 'otherAllowances' => 15000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP029', 'name' => 'Neha Agarwal', 'designation' => 'Regional Sales Head', 'department' => 'Sales', 'mobile' => '9876541029', 'email' => 'neha.agarwal@techmicra.com', 'panNo' => 'JKLNA3456C', 'aadharNo' => '123456781029', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345029', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 60000, 'hra' => 24000, 'da' => 6000, 'otherAllowances' => 10000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP030', 'name' => 'Vivek Saxena', 'designation' => 'Sales Executive', 'department' => 'Sales', 'mobile' => '9876541030', 'email' => 'vivek.saxena@techmicra.com', 'panNo' => 'MNOVS7890D', 'aadharNo' => '123456781030', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345030', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 32000, 'hra' => 12800, 'da' => 3200, 'otherAllowances' => 8000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP031', 'name' => 'Poornima Shetty', 'designation' => 'Sales Coordinator', 'department' => 'Sales', 'mobile' => '9876541031', 'email' => 'poornima.shetty@techmicra.com', 'panNo' => 'PQRPS1234E', 'aadharNo' => '123456781031', 'bankName' => 'SBI', 'bankAccount' => '50100012345031', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 28000, 'hra' => 11200, 'da' => 2800, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP032', 'name' => 'Ashwin Rao', 'designation' => 'Business Development', 'department' => 'Sales', 'mobile' => '9876541032', 'email' => 'ashwin.rao@techmicra.com', 'panNo' => 'STUVAR5678F', 'aadharNo' => '123456781032', 'bankName' => 'Kotak Bank', 'bankAccount' => '50100012345032', 'ifscCode' => 'KKBK0001234', 'basicSalary' => 45000, 'hra' => 18000, 'da' => 4500, 'otherAllowances' => 8000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP033', 'name' => 'Ananya Das', 'designation' => 'Inside Sales', 'department' => 'Sales', 'mobile' => '9876541033', 'email' => 'ananya.das@techmicra.com', 'panNo' => 'WXYDD9012G', 'aadharNo' => '123456781033', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345033', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 26000, 'hra' => 10400, 'da' => 2600, 'otherAllowances' => 4000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP034', 'name' => 'Sanjay Kulkarni', 'designation' => 'Key Account Manager', 'department' => 'Sales', 'mobile' => '9876541034', 'email' => 'sanjay.kulkarni@techmicra.com', 'panNo' => 'ABCSK3456H', 'aadharNo' => '123456781034', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345034', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 52000, 'hra' => 20800, 'da' => 5200, 'otherAllowances' => 10000, 'pfApplicable' => true, 'esicApplicable' => false],

            // HR Department (4 employees)
            ['empCode' => 'EMP004', 'name' => 'Sneha Patel', 'designation' => 'HR Manager', 'department' => 'HR', 'mobile' => '9876541004', 'email' => 'sneha.patel@techmicra.com', 'panNo' => 'JKLSP3456D', 'aadharNo' => '123456781004', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345004', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 58000, 'hra' => 23200, 'da' => 5800, 'otherAllowances' => 7000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP012', 'name' => 'Sunita Reddy', 'designation' => 'HR Executive', 'department' => 'HR', 'mobile' => '9876541012', 'email' => 'sunita.reddy@techmicra.com', 'panNo' => 'HIJSR5678L', 'aadharNo' => '123456781012', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345012', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 32000, 'hra' => 12800, 'da' => 3200, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP035', 'name' => 'Divya Krishnamurthy', 'designation' => 'Payroll Specialist', 'department' => 'HR', 'mobile' => '9876541035', 'email' => 'divya.k@techmicra.com', 'panNo' => 'DEFDK7890I', 'aadharNo' => '123456781035', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345035', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 36000, 'hra' => 14400, 'da' => 3600, 'otherAllowances' => 3500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP036', 'name' => 'Arjun Menon', 'designation' => 'Recruiter', 'department' => 'HR', 'mobile' => '9876541036', 'email' => 'arjun.menon@techmicra.com', 'panNo' => 'GHIAM1234J', 'aadharNo' => '123456781036', 'bankName' => 'SBI', 'bankAccount' => '50100012345036', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 30000, 'hra' => 12000, 'da' => 3000, 'otherAllowances' => 2500, 'pfApplicable' => true, 'esicApplicable' => true],

            // Finance Department (5 employees)
            ['empCode' => 'EMP005', 'name' => 'Vikram Rao', 'designation' => 'Finance Officer', 'department' => 'Finance', 'mobile' => '9876541005', 'email' => 'vikram.rao@techmicra.com', 'panNo' => 'MNOVR7890E', 'aadharNo' => '123456781005', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345005', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 52000, 'hra' => 20800, 'da' => 5200, 'otherAllowances' => 5500, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP008', 'name' => 'Kavita Joshi', 'designation' => 'Accounts Executive', 'department' => 'Finance', 'mobile' => '9876541008', 'email' => 'kavita.joshi@techmicra.com', 'panNo' => 'VWXKJ9012H', 'aadharNo' => '123456781008', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345008', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 30000, 'hra' => 12000, 'da' => 3000, 'otherAllowances' => 2500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP037', 'name' => 'Girish Hegde', 'designation' => 'Finance Manager', 'department' => 'Finance', 'mobile' => '9876541037', 'email' => 'girish.hegde@techmicra.com', 'panNo' => 'JKLGH5678K', 'aadharNo' => '123456781037', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345037', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 72000, 'hra' => 28800, 'da' => 7200, 'otherAllowances' => 10000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP038', 'name' => 'Ritu Singhania', 'designation' => 'Tax Analyst', 'department' => 'Finance', 'mobile' => '9876541038', 'email' => 'ritu.singhania@techmicra.com', 'panNo' => 'MNORS9012L', 'aadharNo' => '123456781038', 'bankName' => 'Kotak Bank', 'bankAccount' => '50100012345038', 'ifscCode' => 'KKBK0001234', 'basicSalary' => 42000, 'hra' => 16800, 'da' => 4200, 'otherAllowances' => 4000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP039', 'name' => 'Mohan Pillai', 'designation' => 'Accounts Clerk', 'department' => 'Finance', 'mobile' => '9876541039', 'email' => 'mohan.pillai@techmicra.com', 'panNo' => 'PQRMP3456M', 'aadharNo' => '123456781039', 'bankName' => 'SBI', 'bankAccount' => '50100012345039', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 24000, 'hra' => 9600, 'da' => 2400, 'otherAllowances' => 1800, 'pfApplicable' => true, 'esicApplicable' => true],

            // Purchase Department (3 employees)
            ['empCode' => 'EMP006', 'name' => 'Anita Desai', 'designation' => 'Purchase Manager', 'department' => 'Purchase', 'mobile' => '9876541006', 'email' => 'anita.desai@techmicra.com', 'panNo' => 'PQRAD1234F', 'aadharNo' => '123456781006', 'bankName' => 'Kotak Bank', 'bankAccount' => '50100012345006', 'ifscCode' => 'KKBK0001234', 'basicSalary' => 50000, 'hra' => 20000, 'da' => 5000, 'otherAllowances' => 6000, 'pfApplicable' => true, 'esicApplicable' => false],
            ['empCode' => 'EMP040', 'name' => 'Bharat Singh', 'designation' => 'Purchase Executive', 'department' => 'Purchase', 'mobile' => '9876541040', 'email' => 'bharat.singh@techmicra.com', 'panNo' => 'STUBS7890N', 'aadharNo' => '123456781040', 'bankName' => 'ICICI Bank', 'bankAccount' => '50100012345040', 'ifscCode' => 'ICIC0001234', 'basicSalary' => 32000, 'hra' => 12800, 'da' => 3200, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP041', 'name' => 'Chitra Nambiar', 'designation' => 'Vendor Coordinator', 'department' => 'Purchase', 'mobile' => '9876541041', 'email' => 'chitra.nambiar@techmicra.com', 'panNo' => 'WXYCN1234O', 'aadharNo' => '123456781041', 'bankName' => 'Axis Bank', 'bankAccount' => '50100012345041', 'ifscCode' => 'UTIB0001234', 'basicSalary' => 28000, 'hra' => 11200, 'da' => 2800, 'otherAllowances' => 2500, 'pfApplicable' => true, 'esicApplicable' => true],

            // Warehouse Department (5 employees)
            ['empCode' => 'EMP007', 'name' => 'Suresh Menon', 'designation' => 'Warehouse Supervisor', 'department' => 'Warehouse', 'mobile' => '9876541007', 'email' => 'suresh.menon@techmicra.com', 'panNo' => 'STUSM5678G', 'aadharNo' => '123456781007', 'bankName' => 'SBI', 'bankAccount' => '50100012345007', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 35000, 'hra' => 14000, 'da' => 3500, 'otherAllowances' => 3000, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP013', 'name' => 'Arun Nair', 'designation' => 'Store Keeper', 'department' => 'Warehouse', 'mobile' => '9876541013', 'email' => 'arun.nair@techmicra.com', 'panNo' => 'KLMAN9012M', 'aadharNo' => '123456781013', 'bankName' => 'SBI', 'bankAccount' => '50100012345013', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 24000, 'hra' => 9600, 'da' => 2400, 'otherAllowances' => 1800, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP042', 'name' => 'Dinesh Choudhary', 'designation' => 'Inventory Clerk', 'department' => 'Warehouse', 'mobile' => '9876541042', 'email' => 'dinesh.choudhary@techmicra.com', 'panNo' => 'ABCDC5678P', 'aadharNo' => '123456781042', 'bankName' => 'Bank of Baroda', 'bankAccount' => '50100012345042', 'ifscCode' => 'BARB0001234', 'basicSalary' => 22000, 'hra' => 8800, 'da' => 2200, 'otherAllowances' => 1500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP043', 'name' => 'Faisal Ahmed', 'designation' => 'Material Handler', 'department' => 'Warehouse', 'mobile' => '9876541043', 'email' => 'faisal.ahmed@techmicra.com', 'panNo' => 'DEFFA9012Q', 'aadharNo' => '123456781043', 'bankName' => 'Canara Bank', 'bankAccount' => '50100012345043', 'ifscCode' => 'CNRB0001234', 'basicSalary' => 20000, 'hra' => 8000, 'da' => 2000, 'otherAllowances' => 1400, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP044', 'name' => 'Harish Gowda', 'designation' => 'Forklift Operator', 'department' => 'Warehouse', 'mobile' => '9876541044', 'email' => 'harish.gowda@techmicra.com', 'panNo' => 'GHIHG3456R', 'aadharNo' => '123456781044', 'bankName' => 'SBI', 'bankAccount' => '50100012345044', 'ifscCode' => 'SBIN0001234', 'basicSalary' => 21000, 'hra' => 8400, 'da' => 2100, 'otherAllowances' => 1500, 'pfApplicable' => true, 'esicApplicable' => true],

            // Admin Department (2 employees)
            ['empCode' => 'EMP014', 'name' => 'Pooja Malhotra', 'designation' => 'Admin Executive', 'department' => 'Admin', 'mobile' => '9876541014', 'email' => 'pooja.malhotra@techmicra.com', 'panNo' => 'NOPPM3456N', 'aadharNo' => '123456781014', 'bankName' => 'Punjab National Bank', 'bankAccount' => '50100012345014', 'ifscCode' => 'PUNB0001234', 'basicSalary' => 30000, 'hra' => 12000, 'da' => 3000, 'otherAllowances' => 2500, 'pfApplicable' => true, 'esicApplicable' => true],
            ['empCode' => 'EMP045', 'name' => 'Isha Bhatt', 'designation' => 'Office Assistant', 'department' => 'Admin', 'mobile' => '9876541045', 'email' => 'isha.bhatt@techmicra.com', 'panNo' => 'JKLIB7890S', 'aadharNo' => '123456781045', 'bankName' => 'HDFC Bank', 'bankAccount' => '50100012345045', 'ifscCode' => 'HDFC0001234', 'basicSalary' => 22000, 'hra' => 8800, 'da' => 2200, 'otherAllowances' => 1800, 'pfApplicable' => true, 'esicApplicable' => true],
        ];

        foreach ($employees as $e) {
            Employee::firstOrCreate(['empCode' => $e['empCode']], array_merge($e, [
                'doj' => now()->subMonths(rand(6, 36))->toDateString(),
                'isActive' => true,
            ]));
        }
        echo "✅ Created " . count($employees) . " employees\n";

        // ══════════════════════════════════════════════════════════════════════
        // HR - SALARY HEADS (5.2)
        // ══════════════════════════════════════════════════════════════════════
        $salaryHeads = [
            ['headCode' => 'BASIC', 'headName' => 'Basic Salary', 'headType' => 'Earning', 'description' => 'Basic pay component'],
            ['headCode' => 'HRA', 'headName' => 'House Rent Allowance', 'headType' => 'Earning', 'description' => 'Housing allowance'],
            ['headCode' => 'DA', 'headName' => 'Dearness Allowance', 'headType' => 'Earning', 'description' => 'Inflation adjustment'],
            ['headCode' => 'TA', 'headName' => 'Transport Allowance', 'headType' => 'Earning', 'description' => 'Travel expenses'],
            ['headCode' => 'MA', 'headName' => 'Medical Allowance', 'headType' => 'Earning', 'description' => 'Medical benefits'],
            ['headCode' => 'SA', 'headName' => 'Special Allowance', 'headType' => 'Earning', 'description' => 'Special pay'],
            ['headCode' => 'PF', 'headName' => 'Provident Fund', 'headType' => 'Deduction', 'description' => '12% PF contribution'],
            ['headCode' => 'ESIC', 'headName' => 'ESIC', 'headType' => 'Deduction', 'description' => 'Employee State Insurance'],
            ['headCode' => 'PT', 'headName' => 'Professional Tax', 'headType' => 'Deduction', 'description' => 'State professional tax'],
            ['headCode' => 'TDS', 'headName' => 'TDS', 'headType' => 'Deduction', 'description' => 'Tax deducted at source'],
            ['headCode' => 'LOP', 'headName' => 'Loss of Pay', 'headType' => 'Deduction', 'description' => 'Absent day deduction'],
            ['headCode' => 'LOAN', 'headName' => 'Loan Recovery', 'headType' => 'Deduction', 'description' => 'Monthly loan EMI'],
        ];

        foreach ($salaryHeads as $h) {
            SalaryHead::firstOrCreate(['headCode' => $h['headCode']], array_merge($h, ['isActive' => true]));
        }
        echo "✅ Created " . count($salaryHeads) . " salary heads\n";

        // ══════════════════════════════════════════════════════════════════════
        // HR - EMPLOYEE SALARY STRUCTURES (5.3)
        // ══════════════════════════════════════════════════════════════════════
        $allEmployees = Employee::all();
        foreach ($allEmployees as $emp) {
            EmployeeSalaryStructure::firstOrCreate(
                ['employeeId' => $emp->id, 'effectiveDate' => '2026-01-01'],
                [
                    'basic' => $emp->basicSalary,
                    'hra' => $emp->basicSalary * 0.4,
                    'da' => $emp->basicSalary * 0.1,
                    'pfPercent' => 12,
                    'esicPercent' => 0.75,
                    'otherAllowances' => $emp->basicSalary * 0.1,
                    'isActive' => true,
                    'createdBy' => 1,
                ]
            );
        }
        echo "✅ Created " . count($allEmployees) . " salary structures\n";

        // ══════════════════════════════════════════════════════════════════════
        // HR - EMPLOYEE SALARY SHEETS (5.4) - 6 months of data
        // ══════════════════════════════════════════════════════════════════════
        $monthsData = [
            ['month' => 'October', 'year' => 2025, 'days' => 31, 'status' => 'Processed'],
            ['month' => 'November', 'year' => 2025, 'days' => 30, 'status' => 'Processed'],
            ['month' => 'December', 'year' => 2025, 'days' => 31, 'status' => 'Processed'],
            ['month' => 'January', 'year' => 2026, 'days' => 31, 'status' => 'Processed'],
            ['month' => 'February', 'year' => 2026, 'days' => 28, 'status' => 'Processed'],
            ['month' => 'March', 'year' => 2026, 'days' => 31, 'status' => 'Draft'],
        ];
        $sheetCount = 0;
        foreach ($allEmployees as $emp) {
            foreach ($monthsData as $m) {
                $basic = $emp->basicSalary ?? 25000;
                $hra = $emp->hra ?? ($basic * 0.4);
                $da = $emp->da ?? ($basic * 0.1);
                $other = $emp->otherAllowances ?? ($basic * 0.1);
                $gross = $basic + $hra + $da + $other;
                
                $pfDeduction = $emp->pfApplicable ? ($basic * 0.12) : 0;
                $esicDeduction = $emp->esicApplicable ? ($gross * 0.0075) : 0;
                $tdsDeduction = $basic > 40000 ? ($gross * 0.05) : 0; // TDS for higher earners
                $deductions = $pfDeduction + $esicDeduction + $tdsDeduction;
                
                $presentDays = rand($m['days'] - 4, $m['days']);
                $absentDays = $m['days'] - $presentDays;
                
                EmployeeSalarySheet::firstOrCreate(
                    ['employeeId' => $emp->id, 'month' => $m['month'], 'year' => $m['year']],
                    [
                        'totalDays' => $m['days'],
                        'presentDays' => $presentDays,
                        'absentDays' => $absentDays,
                        'grossSalary' => $gross,
                        'deductions' => $deductions,
                        'pfDeduction' => $pfDeduction,
                        'esicDeduction' => $esicDeduction,
                        'tdsDeduction' => $tdsDeduction,
                        'otherDeductions' => 0,
                        'netPay' => $gross - $deductions,
                        'status' => $m['status'],
                        'isActive' => true,
                        'createdBy' => 1,
                    ]
                );
                $sheetCount++;
            }
        }
        echo "✅ Created {$sheetCount} salary sheets (6 months × " . count($allEmployees) . " employees)\n";

        // ══════════════════════════════════════════════════════════════════════
        // HR - EMPLOYEE ADVANCES (5.5) - Comprehensive test data with diverse statuses
        // ══════════════════════════════════════════════════════════════════════
        $advances = [
            // Pending Advances (8)
            ['employeeId' => 3, 'advanceDate' => '2026-02-20', 'amount' => 10000, 'purpose' => 'Vehicle Repair', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 2, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 8, 'advanceDate' => '2026-02-15', 'amount' => 12000, 'purpose' => 'Child Education Fee', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 3, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 10, 'advanceDate' => '2026-03-01', 'amount' => 18000, 'purpose' => 'Festival Advance', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 3, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 16, 'advanceDate' => '2026-03-05', 'amount' => 8000, 'purpose' => 'Medical Checkup', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 2, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 22, 'advanceDate' => '2026-03-10', 'amount' => 15000, 'purpose' => 'Home Renovation', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 3, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 28, 'advanceDate' => '2026-03-08', 'amount' => 25000, 'purpose' => 'Wedding Expense', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 5, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 35, 'advanceDate' => '2026-03-12', 'amount' => 20000, 'purpose' => 'Vehicle Purchase', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 4, 'status' => 'Pending', 'recoveredAmount' => 0],
            ['employeeId' => 40, 'advanceDate' => '2026-03-15', 'amount' => 12000, 'purpose' => 'Emergency Fund', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 2, 'status' => 'Pending', 'recoveredAmount' => 0],

            // Approved Advances (6)
            ['employeeId' => 2, 'advanceDate' => '2026-02-01', 'amount' => 15000, 'purpose' => 'Home Repair', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 3, 'status' => 'Approved', 'recoveredAmount' => 0],
            ['employeeId' => 5, 'advanceDate' => '2026-01-05', 'amount' => 30000, 'purpose' => 'Festival Advance', 'recoveryMonth' => 'February 2026', 'recoveryMonths' => 6, 'status' => 'Approved', 'recoveredAmount' => 5000],
            ['employeeId' => 18, 'advanceDate' => '2026-02-10', 'amount' => 22000, 'purpose' => 'Education Fees', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 4, 'status' => 'Approved', 'recoveredAmount' => 0],
            ['employeeId' => 25, 'advanceDate' => '2026-02-20', 'amount' => 35000, 'purpose' => 'Medical Surgery', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 7, 'status' => 'Approved', 'recoveredAmount' => 5000],
            ['employeeId' => 32, 'advanceDate' => '2026-02-25', 'amount' => 18000, 'purpose' => 'Furniture Purchase', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 3, 'status' => 'Approved', 'recoveredAmount' => 0],
            ['employeeId' => 38, 'advanceDate' => '2026-03-01', 'amount' => 28000, 'purpose' => 'House Rent Deposit', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 4, 'status' => 'Approved', 'recoveredAmount' => 0],

            // Partially Recovered (10)
            ['employeeId' => 1, 'advanceDate' => '2026-01-15', 'amount' => 20000, 'purpose' => 'Medical Emergency', 'recoveryMonth' => 'February 2026', 'recoveryMonths' => 4, 'status' => 'Partially Recovered', 'recoveredAmount' => 10000],
            ['employeeId' => 4, 'advanceDate' => '2025-11-01', 'amount' => 50000, 'purpose' => 'Education Loan', 'recoveryMonth' => 'December 2025', 'recoveryMonths' => 10, 'status' => 'Partially Recovered', 'recoveredAmount' => 25000],
            ['employeeId' => 7, 'advanceDate' => '2026-01-20', 'amount' => 8000, 'purpose' => 'Marriage Expense', 'recoveryMonth' => 'February 2026', 'recoveryMonths' => 2, 'status' => 'Partially Recovered', 'recoveredAmount' => 4000],
            ['employeeId' => 9, 'advanceDate' => '2025-10-05', 'amount' => 40000, 'purpose' => 'Medical Treatment', 'recoveryMonth' => 'November 2025', 'recoveryMonths' => 8, 'status' => 'Partially Recovered', 'recoveredAmount' => 20000],
            ['employeeId' => 11, 'advanceDate' => '2025-09-15', 'amount' => 100000, 'purpose' => 'Home Loan Down Payment', 'recoveryMonth' => 'October 2025', 'recoveryMonths' => 20, 'status' => 'Partially Recovered', 'recoveredAmount' => 35000],
            ['employeeId' => 14, 'advanceDate' => '2025-12-01', 'amount' => 45000, 'purpose' => 'Vehicle Loan', 'recoveryMonth' => 'January 2026', 'recoveryMonths' => 9, 'status' => 'Partially Recovered', 'recoveredAmount' => 15000],
            ['employeeId' => 20, 'advanceDate' => '2025-11-15', 'amount' => 60000, 'purpose' => 'Business Investment', 'recoveryMonth' => 'December 2025', 'recoveryMonths' => 12, 'status' => 'Partially Recovered', 'recoveredAmount' => 25000],
            ['employeeId' => 27, 'advanceDate' => '2025-12-10', 'amount' => 30000, 'purpose' => 'Child Education', 'recoveryMonth' => 'January 2026', 'recoveryMonths' => 6, 'status' => 'Partially Recovered', 'recoveredAmount' => 15000],
            ['employeeId' => 33, 'advanceDate' => '2026-01-01', 'amount' => 25000, 'purpose' => 'Festival Expenses', 'recoveryMonth' => 'February 2026', 'recoveryMonths' => 5, 'status' => 'Partially Recovered', 'recoveredAmount' => 10000],
            ['employeeId' => 42, 'advanceDate' => '2025-10-20', 'amount' => 35000, 'purpose' => 'Home Appliances', 'recoveryMonth' => 'November 2025', 'recoveryMonths' => 7, 'status' => 'Partially Recovered', 'recoveredAmount' => 20000],

            // Fully Recovered (8)
            ['employeeId' => 6, 'advanceDate' => '2025-12-10', 'amount' => 25000, 'purpose' => 'House Rent Deposit', 'recoveryMonth' => 'January 2026', 'recoveryMonths' => 5, 'status' => 'Fully Recovered', 'recoveredAmount' => 25000],
            ['employeeId' => 12, 'advanceDate' => '2026-01-25', 'amount' => 5000, 'purpose' => 'Emergency Fund', 'recoveryMonth' => 'February 2026', 'recoveryMonths' => 1, 'status' => 'Fully Recovered', 'recoveredAmount' => 5000],
            ['employeeId' => 3, 'advanceDate' => '2025-08-10', 'amount' => 15000, 'purpose' => 'Bike Purchase', 'recoveryMonth' => 'September 2025', 'recoveryMonths' => 5, 'status' => 'Fully Recovered', 'recoveredAmount' => 15000],
            ['employeeId' => 15, 'advanceDate' => '2025-07-15', 'amount' => 20000, 'purpose' => 'Medical Treatment', 'recoveryMonth' => 'August 2025', 'recoveryMonths' => 4, 'status' => 'Fully Recovered', 'recoveredAmount' => 20000],
            ['employeeId' => 21, 'advanceDate' => '2025-08-20', 'amount' => 18000, 'purpose' => 'Education Fees', 'recoveryMonth' => 'September 2025', 'recoveryMonths' => 3, 'status' => 'Fully Recovered', 'recoveredAmount' => 18000],
            ['employeeId' => 29, 'advanceDate' => '2025-09-01', 'amount' => 12000, 'purpose' => 'Travel Expense', 'recoveryMonth' => 'October 2025', 'recoveryMonths' => 2, 'status' => 'Fully Recovered', 'recoveredAmount' => 12000],
            ['employeeId' => 36, 'advanceDate' => '2025-10-05', 'amount' => 30000, 'purpose' => 'Laptop Purchase', 'recoveryMonth' => 'November 2025', 'recoveryMonths' => 6, 'status' => 'Fully Recovered', 'recoveredAmount' => 30000],
            ['employeeId' => 44, 'advanceDate' => '2025-11-10', 'amount' => 10000, 'purpose' => 'Mobile Purchase', 'recoveryMonth' => 'December 2025', 'recoveryMonths' => 2, 'status' => 'Fully Recovered', 'recoveredAmount' => 10000],

            // Cancelled (3)
            ['employeeId' => 5, 'advanceDate' => '2026-03-05', 'amount' => 20000, 'purpose' => 'Laptop Purchase', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 4, 'status' => 'Cancelled', 'recoveredAmount' => 0],
            ['employeeId' => 19, 'advanceDate' => '2026-02-28', 'amount' => 15000, 'purpose' => 'Vacation', 'recoveryMonth' => 'March 2026', 'recoveryMonths' => 3, 'status' => 'Cancelled', 'recoveredAmount' => 0],
            ['employeeId' => 31, 'advanceDate' => '2026-03-02', 'amount' => 25000, 'purpose' => 'Investment', 'recoveryMonth' => 'April 2026', 'recoveryMonths' => 5, 'status' => 'Cancelled', 'recoveredAmount' => 0],
        ];

        foreach ($advances as $a) {
            $data = array_merge($a, [
                'monthlyDeduction' => $a['amount'] / $a['recoveryMonths'],
                'balanceAmount' => $a['amount'] - $a['recoveredAmount'],
                'isActive' => true,
                'createdBy' => 1,
                'approvedBy' => $a['status'] !== 'Pending' ? 1 : null,
            ]);
            EmployeeAdvance::firstOrCreate(
                ['employeeId' => $a['employeeId'], 'advanceDate' => $a['advanceDate']],
                $data
            );
        }
        echo "✅ Created " . count($advances) . " employee advances\n";

        // ══════════════════════════════════════════════════════════════════════
        // FINANCE - JOURNAL VOUCHERS
        // ══════════════════════════════════════════════════════════════════════
        $journalVouchers = [
            ['voucherNo' => 'JV-001', 'voucherType' => 'Journal', 'debitAccount' => 'Raw Material Purchase', 'creditAccount' => 'Accounts Payable', 'amount' => 150000, 'narration' => 'Steel sheets purchase from SAIL'],
            ['voucherNo' => 'JV-002', 'voucherType' => 'Journal', 'debitAccount' => 'Salary Expense', 'creditAccount' => 'Cash/Bank', 'amount' => 285000, 'narration' => 'Monthly salary disbursement'],
            ['voucherNo' => 'JV-003', 'voucherType' => 'Payment', 'debitAccount' => 'Vendor Payment', 'creditAccount' => 'HDFC Bank', 'amount' => 75000, 'narration' => 'Payment to Asian Paints'],
            ['voucherNo' => 'JV-004', 'voucherType' => 'Receipt', 'debitAccount' => 'ICICI Bank', 'creditAccount' => 'Accounts Receivable', 'amount' => 450000, 'narration' => 'Receipt from Tata Motors'],
            ['voucherNo' => 'JV-005', 'voucherType' => 'Contra', 'debitAccount' => 'Petty Cash', 'creditAccount' => 'SBI Bank', 'amount' => 25000, 'narration' => 'Cash withdrawal for petty expenses'],
            ['voucherNo' => 'JV-006', 'voucherType' => 'Journal', 'debitAccount' => 'Electricity Expense', 'creditAccount' => 'Accounts Payable', 'amount' => 45000, 'narration' => 'Factory electricity bill'],
            ['voucherNo' => 'JV-007', 'voucherType' => 'Payment', 'debitAccount' => 'GST Payable', 'creditAccount' => 'HDFC Bank', 'amount' => 125000, 'narration' => 'GST payment for Feb 2026'],
            ['voucherNo' => 'JV-008', 'voucherType' => 'Receipt', 'debitAccount' => 'SBI Bank', 'creditAccount' => 'Sales Revenue', 'amount' => 780000, 'narration' => 'Advance from Mahindra'],
            ['voucherNo' => 'JV-009', 'voucherType' => 'Journal', 'debitAccount' => 'Depreciation Expense', 'creditAccount' => 'Accumulated Depreciation', 'amount' => 85000, 'narration' => 'Monthly depreciation entry'],
            ['voucherNo' => 'JV-010', 'voucherType' => 'Journal', 'debitAccount' => 'Rent Expense', 'creditAccount' => 'Cash/Bank', 'amount' => 120000, 'narration' => 'Factory rent for March 2026'],
        ];

        foreach ($journalVouchers as $jv) {
            JournalVoucher::firstOrCreate(['voucherNo' => $jv['voucherNo']], array_merge($jv, [
                'isActive' => true,
                'createdBy' => 1,
            ]));
        }
        echo "✅ Created " . count($journalVouchers) . " journal vouchers (legacy)\n";

        // ══════════════════════════════════════════════════════════════════════
        // FINANCE - NEW VOUCHER TYPES (for frontend Finance module)
        // ══════════════════════════════════════════════════════════════════════
        
        // Journal Vouchers (Tab 1) - Extended data for dashboard testing
        $voucherJournals = [
            ['journalNo' => 'JV-2026-001', 'date' => now()->subDays(45), 'debitAccount' => 'Raw Material Purchase', 'creditAccount' => 'Accounts Payable', 'amount' => 150000, 'narration' => 'Steel sheets purchase from SAIL', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-002', 'date' => now()->subDays(42), 'debitAccount' => 'Salary Expense', 'creditAccount' => 'Bank Account', 'amount' => 285000, 'narration' => 'Monthly salary disbursement Feb 2026', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-003', 'date' => now()->subDays(38), 'debitAccount' => 'Electricity Expense', 'creditAccount' => 'Accounts Payable', 'amount' => 45000, 'narration' => 'Factory electricity bill', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-004', 'date' => now()->subDays(35), 'debitAccount' => 'Depreciation Expense', 'creditAccount' => 'Accumulated Depreciation', 'amount' => 85000, 'narration' => 'Monthly depreciation entry', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-005', 'date' => now()->subDays(32), 'debitAccount' => 'Rent Expense', 'creditAccount' => 'Bank Account', 'amount' => 120000, 'narration' => 'Factory rent for March 2026', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-006', 'date' => now()->subDays(28), 'debitAccount' => 'Insurance Expense', 'creditAccount' => 'Prepaid Insurance', 'amount' => 95000, 'narration' => 'Annual insurance amortization', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-007', 'date' => now()->subDays(25), 'debitAccount' => 'Machinery Repairs', 'creditAccount' => 'Accounts Payable', 'amount' => 67000, 'narration' => 'CNC machine maintenance', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-008', 'date' => now()->subDays(20), 'debitAccount' => 'Marketing Expense', 'creditAccount' => 'Bank Account', 'amount' => 125000, 'narration' => 'Digital marketing campaign', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-009', 'date' => now()->subDays(15), 'debitAccount' => 'Travel Expense', 'creditAccount' => 'Petty Cash', 'amount' => 38000, 'narration' => 'Sales team travel expenses', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-010', 'date' => now()->subDays(12), 'debitAccount' => 'Office Supplies', 'creditAccount' => 'Bank Account', 'amount' => 22000, 'narration' => 'Stationery and consumables', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-011', 'date' => now()->subDays(10), 'debitAccount' => 'Professional Fees', 'creditAccount' => 'Accounts Payable', 'amount' => 75000, 'narration' => 'Legal consultation fees', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-012', 'date' => now()->subDays(8), 'debitAccount' => 'Telephone Expense', 'creditAccount' => 'Bank Account', 'amount' => 18500, 'narration' => 'Monthly telecom bills', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-013', 'date' => now()->subDays(5), 'debitAccount' => 'Security Expense', 'creditAccount' => 'Accounts Payable', 'amount' => 45000, 'narration' => 'Factory security services', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-014', 'date' => now()->subDays(3), 'debitAccount' => 'Water Charges', 'creditAccount' => 'Bank Account', 'amount' => 12000, 'narration' => 'Industrial water supply', 'createdBy' => 1],
            ['journalNo' => 'JV-2026-015', 'date' => now()->subDays(1), 'debitAccount' => 'Salary Expense', 'creditAccount' => 'Bank Account', 'amount' => 295000, 'narration' => 'Monthly salary disbursement Mar 2026', 'createdBy' => 1],
        ];
        VoucherJournal::withTrashed()->whereIn('journalNo', collect($voucherJournals)->pluck('journalNo'))->forceDelete();
        foreach ($voucherJournals as $vj) {
            VoucherJournal::create($vj);
        }
        echo "✅ Created " . count($voucherJournals) . " voucher journals\n";

        // Payment & Receipt Vouchers (Tab 2) - Extended with all payment modes
        $paymentReceipts = [
            // Payments - Various modes
            ['voucherNo' => 'PV-2026-001', 'voucherType' => 'Payment', 'date' => now()->subDays(44), 'partyName' => 'SAIL - Steel Authority', 'amount' => 75000, 'mode' => 'Bank', 'referenceNo' => 'TXN001', 'remarks' => 'Payment to SAIL for steel', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-002', 'voucherType' => 'Payment', 'date' => now()->subDays(40), 'partyName' => 'GST Department', 'amount' => 125000, 'mode' => 'Online', 'referenceNo' => 'GST-FEB-26', 'remarks' => 'GST payment for Feb 2026', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-003', 'voucherType' => 'Payment', 'date' => now()->subDays(36), 'partyName' => 'Asian Paints Ltd', 'amount' => 45000, 'mode' => 'Cheque', 'referenceNo' => 'CHQ-7890', 'remarks' => 'Paint supplies payment', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-004', 'voucherType' => 'Payment', 'date' => now()->subDays(32), 'partyName' => 'Havells India Ltd', 'amount' => 68000, 'mode' => 'UPI', 'referenceNo' => 'UPI-2026-001', 'remarks' => 'Electrical supplies', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-005', 'voucherType' => 'Payment', 'date' => now()->subDays(28), 'partyName' => 'Tata Steel Ltd', 'amount' => 185000, 'mode' => 'Bank', 'referenceNo' => 'TXN002', 'remarks' => 'Steel rods payment', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-006', 'voucherType' => 'Payment', 'date' => now()->subDays(24), 'partyName' => 'JSW Steel Ltd', 'amount' => 95000, 'mode' => 'Online', 'referenceNo' => 'NET-003', 'remarks' => 'Steel sheets advance', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-007', 'voucherType' => 'Payment', 'date' => now()->subDays(20), 'partyName' => 'Petty Cash Reimb.', 'amount' => 15000, 'mode' => 'Cash', 'referenceNo' => 'PCR-001', 'remarks' => 'Office petty expenses', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-008', 'voucherType' => 'Payment', 'date' => now()->subDays(16), 'partyName' => 'Electricity Board', 'amount' => 48000, 'mode' => 'Online', 'referenceNo' => 'EB-MAR-26', 'remarks' => 'March electricity bill', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-009', 'voucherType' => 'Payment', 'date' => now()->subDays(12), 'partyName' => 'Transport Vendor', 'amount' => 35000, 'mode' => 'UPI', 'referenceNo' => 'UPI-2026-002', 'remarks' => 'Logistics charges', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-010', 'voucherType' => 'Payment', 'date' => now()->subDays(8), 'partyName' => 'Security Services', 'amount' => 42000, 'mode' => 'Bank', 'referenceNo' => 'TXN003', 'remarks' => 'Monthly security charges', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-011', 'voucherType' => 'Payment', 'date' => now()->subDays(4), 'partyName' => 'Office Rent', 'amount' => 85000, 'mode' => 'Cheque', 'referenceNo' => 'CHQ-7891', 'remarks' => 'Office space rent', 'createdBy' => 1],
            ['voucherNo' => 'PV-2026-012', 'voucherType' => 'Payment', 'date' => now()->subDays(2), 'partyName' => 'Canteen Vendor', 'amount' => 28000, 'mode' => 'Cash', 'referenceNo' => 'PCR-002', 'remarks' => 'Monthly canteen expenses', 'createdBy' => 1],
            // Receipts - Various modes
            ['voucherNo' => 'RV-2026-001', 'voucherType' => 'Receipt', 'date' => now()->subDays(42), 'partyName' => 'Tata Motors Ltd', 'amount' => 450000, 'mode' => 'Bank', 'referenceNo' => 'INV-001', 'remarks' => 'Receipt from Tata Motors', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-002', 'voucherType' => 'Receipt', 'date' => now()->subDays(38), 'partyName' => 'Mahindra & Mahindra', 'amount' => 780000, 'mode' => 'Cheque', 'referenceNo' => 'CHQ-4567', 'remarks' => 'Advance from Mahindra', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-003', 'voucherType' => 'Receipt', 'date' => now()->subDays(34), 'partyName' => 'Bajaj Auto Ltd', 'amount' => 325000, 'mode' => 'Bank', 'referenceNo' => 'INV-002', 'remarks' => 'Invoice payment', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-004', 'voucherType' => 'Receipt', 'date' => now()->subDays(30), 'partyName' => 'Hero MotoCorp', 'amount' => 520000, 'mode' => 'Online', 'referenceNo' => 'NEFT-001', 'remarks' => 'Online transfer received', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-005', 'voucherType' => 'Receipt', 'date' => now()->subDays(26), 'partyName' => 'Ashok Leyland', 'amount' => 680000, 'mode' => 'Bank', 'referenceNo' => 'INV-003', 'remarks' => 'Bulk order payment', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-006', 'voucherType' => 'Receipt', 'date' => now()->subDays(22), 'partyName' => 'Tata Motors Ltd', 'amount' => 390000, 'mode' => 'UPI', 'referenceNo' => 'UPI-RCV-001', 'remarks' => 'Partial invoice payment', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-007', 'voucherType' => 'Receipt', 'date' => now()->subDays(18), 'partyName' => 'Mahindra & Mahindra', 'amount' => 445000, 'mode' => 'Cheque', 'referenceNo' => 'CHQ-4568', 'remarks' => 'Balance payment', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-008', 'voucherType' => 'Receipt', 'date' => now()->subDays(14), 'partyName' => 'Bajaj Auto Ltd', 'amount' => 275000, 'mode' => 'Online', 'referenceNo' => 'RTGS-001', 'remarks' => 'RTGS transfer', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-009', 'voucherType' => 'Receipt', 'date' => now()->subDays(10), 'partyName' => 'Cash Sales', 'amount' => 85000, 'mode' => 'Cash', 'referenceNo' => 'CSR-001', 'remarks' => 'Counter cash sale', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-010', 'voucherType' => 'Receipt', 'date' => now()->subDays(6), 'partyName' => 'Hero MotoCorp', 'amount' => 620000, 'mode' => 'Bank', 'referenceNo' => 'INV-004', 'remarks' => 'Final settlement', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-011', 'voucherType' => 'Receipt', 'date' => now()->subDays(3), 'partyName' => 'Ashok Leyland', 'amount' => 510000, 'mode' => 'UPI', 'referenceNo' => 'UPI-RCV-002', 'remarks' => 'Advance for new order', 'createdBy' => 1],
            ['voucherNo' => 'RV-2026-012', 'voucherType' => 'Receipt', 'date' => now()->subDays(1), 'partyName' => 'Tata Motors Ltd', 'amount' => 295000, 'mode' => 'Card', 'referenceNo' => 'CC-RCV-001', 'remarks' => 'Credit card payment', 'createdBy' => 1],
        ];
        VoucherPaymentReceipt::withTrashed()->whereIn('voucherNo', collect($paymentReceipts)->pluck('voucherNo'))->forceDelete();
        foreach ($paymentReceipts as $pr) {
            VoucherPaymentReceipt::create($pr);
        }
        echo "✅ Created " . count($paymentReceipts) . " payment/receipt vouchers\n";

        // Contra Vouchers (Tab 3) - Extended data
        $contraVouchers = [
            ['voucherNo' => 'CV-2026-001', 'date' => now()->subDays(43), 'fromAccount' => 'SBI Bank', 'toAccount' => 'Petty Cash', 'amount' => 25000, 'remarks' => 'Cash withdrawal for petty expenses', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-002', 'date' => now()->subDays(37), 'fromAccount' => 'HDFC Bank', 'toAccount' => 'Petty Cash', 'amount' => 15000, 'remarks' => 'Cash withdrawal for office expenses', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-003', 'date' => now()->subDays(31), 'fromAccount' => 'Cash', 'toAccount' => 'ICICI Bank', 'amount' => 50000, 'remarks' => 'Cash deposit to bank', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-004', 'date' => now()->subDays(27), 'fromAccount' => 'HDFC Bank', 'toAccount' => 'SBI Bank', 'amount' => 200000, 'remarks' => 'Inter-bank transfer for operations', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-005', 'date' => now()->subDays(23), 'fromAccount' => 'ICICI Bank', 'toAccount' => 'Petty Cash', 'amount' => 35000, 'remarks' => 'Petty cash replenishment', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-006', 'date' => now()->subDays(19), 'fromAccount' => 'Cash', 'toAccount' => 'HDFC Bank', 'amount' => 75000, 'remarks' => 'Cash sales deposit', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-007', 'date' => now()->subDays(15), 'fromAccount' => 'SBI Bank', 'toAccount' => 'ICICI Bank', 'amount' => 150000, 'remarks' => 'Fund transfer for vendor payments', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-008', 'date' => now()->subDays(11), 'fromAccount' => 'HDFC Bank', 'toAccount' => 'Cash', 'amount' => 40000, 'remarks' => 'Cash withdrawal for wages', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-009', 'date' => now()->subDays(7), 'fromAccount' => 'Cash', 'toAccount' => 'SBI Bank', 'amount' => 85000, 'remarks' => 'Collection deposit', 'createdBy' => 1],
            ['voucherNo' => 'CV-2026-010', 'date' => now()->subDays(3), 'fromAccount' => 'ICICI Bank', 'toAccount' => 'HDFC Bank', 'amount' => 300000, 'remarks' => 'Salary account funding', 'createdBy' => 1],
        ];
        VoucherContra::withTrashed()->whereIn('voucherNo', collect($contraVouchers)->pluck('voucherNo'))->forceDelete();
        foreach ($contraVouchers as $cv) {
            VoucherContra::create($cv);
        }
        echo "✅ Created " . count($contraVouchers) . " contra vouchers\n";

        // GST Vouchers (Tab 4) - Extended data
        $gstVouchers = [
            ['voucherNo' => 'GV-2026-001', 'date' => now()->subDays(40), 'gstLedger' => 'Input', 'adjustmentType' => 'Reversal', 'amount' => 45000, 'remarks' => 'ITC reversal on exempt goods', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-002', 'date' => now()->subDays(35), 'gstLedger' => 'Output', 'adjustmentType' => 'Adjustment', 'amount' => 32000, 'remarks' => 'Output GST adjustment', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-003', 'date' => now()->subDays(30), 'gstLedger' => 'Input', 'adjustmentType' => 'Correction', 'amount' => 18000, 'remarks' => 'ITC correction for debit note', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-004', 'date' => now()->subDays(28), 'gstLedger' => 'Output', 'adjustmentType' => 'Reversal', 'amount' => 55000, 'remarks' => 'Credit note adjustment', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-005', 'date' => now()->subDays(25), 'gstLedger' => 'Input', 'adjustmentType' => 'Adjustment', 'amount' => 28000, 'remarks' => 'ITC claim for imports', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-006', 'date' => now()->subDays(20), 'gstLedger' => 'Output', 'adjustmentType' => 'Correction', 'amount' => 42000, 'remarks' => 'Invoice correction adjustment', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-007', 'date' => now()->subDays(15), 'gstLedger' => 'Input', 'adjustmentType' => 'Reversal', 'amount' => 35000, 'remarks' => 'Vendor non-compliance reversal', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-008', 'date' => now()->subDays(10), 'gstLedger' => 'Output', 'adjustmentType' => 'Adjustment', 'amount' => 68000, 'remarks' => 'Export refund claim', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-009', 'date' => now()->subDays(6), 'gstLedger' => 'Input', 'adjustmentType' => 'Correction', 'amount' => 22000, 'remarks' => 'Purchase return ITC correction', 'createdBy' => 1],
            ['voucherNo' => 'GV-2026-010', 'date' => now()->subDays(2), 'gstLedger' => 'Output', 'adjustmentType' => 'Reversal', 'amount' => 38000, 'remarks' => 'Sales return reversal', 'createdBy' => 1],
        ];
        VoucherGST::withTrashed()->whereIn('voucherNo', collect($gstVouchers)->pluck('voucherNo'))->forceDelete();
        foreach ($gstVouchers as $gv) {
            VoucherGST::create($gv);
        }
        echo "✅ Created " . count($gstVouchers) . " GST vouchers\n";

        // ══════════════════════════════════════════════════════════════════════
        // SALES CYCLE (Inquiry -> Quotation -> SO -> Invoice)
        // ══════════════════════════════════════════════════════════════════════
        
        // Inquiry
        $inq = Inquiry::firstOrCreate(['inquiryNo' => 'INQ-001'], [
            'customerId' => $customer->id,
            'salesPerson' => 'Rahul Sharma',
            'status' => 'Quoted',
            'createdBy' => 1,
        ]);
        InquiryItem::firstOrCreate(['inquiryId' => $inq->id, 'productId' => $p1->id], ['quantity' => 5]);
        
        // Quotation
        $qty = 5;
        $rate = 450000;
        $total = $qty * $rate * 1.28;
        $qt = Quotation::firstOrCreate(['quoteNo' => 'QT-001'], [
            'customerId' => $customer->id,
            'inquiryId' => $inq->id,
            'status' => 'Accepted',
            'totalAmount' => $total,
            'createdBy' => 1,
            'validUntil' => now()->addDays(30),
        ]);
        QuotationItem::firstOrCreate(['quotationId' => $qt->id, 'productId' => $p1->id], [
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'total' => $total
        ]);

        // Sale Order
        $so = SaleOrder::firstOrCreate(['soNo' => 'SO-001'], [
            'customerId' => $customer->id,
            'quotationId' => $qt->id,
            'status' => 'Pending',
            'totalAmount' => $total,
            'createdBy' => 1,
        ]);
        SaleOrderItem::firstOrCreate(['saleOrderId' => $so->id, 'productId' => $p1->id], [
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'total' => $total
        ]);

        // Invoice
        $taxable = $qty * $rate;
        $gst = $taxable * 0.28;
        $invoice = Invoice::firstOrCreate(['invoiceNo' => 'INV-001'], [
            'customerId' => $customer->id,
            'saleOrderId' => $so->id,
            'invoiceDate' => now(),
            'dueDate' => now()->addDays(30),
            'taxableValue' => $taxable,
            'igstAmount' => $gst,
            'grandTotal' => $taxable + $gst,
            'status' => 'Unpaid',
            'createdBy' => 1,
        ]);
        InvoiceItem::firstOrCreate(['invoiceId' => $invoice->id, 'productId' => $p1->id], [
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'igst' => $gst,
            'total' => $taxable + $gst
        ]);

        // Additional sales records
        $inq2 = Inquiry::firstOrCreate(['inquiryNo' => 'INQ-002'], [
            'customerId' => Customer::where('name', 'Mahindra & Mahindra')->first()->id,
            'salesPerson' => 'Rahul Sharma',
            'status' => 'New',
            'createdBy' => 1,
        ]);
        InquiryItem::firstOrCreate(['inquiryId' => $inq2->id, 'productId' => $p2->id], ['quantity' => 3]);

        echo "✅ Sales cycle data created (Inquiries, Quotations, SOs, Invoices)\n";

        // ══════════════════════════════════════════════════════════════════════
        // PURCHASE CYCLE (PO -> GRN)
        // ══════════════════════════════════════════════════════════════════════
        $rmSteel = Product::where('code', 'RM-STEEL-001')->first();
        
        $po = PurchaseOrder::firstOrCreate(['poNo' => 'PO-001'], [
            'vendorId' => $vendor->id,
            'status' => 'Approved',
            'totalAmount' => 500 * 85 * 1.18,
            'createdBy' => 1,
        ]);
        PurchaseOrderItem::firstOrCreate(['purchaseOrderId' => $po->id, 'productId' => $rmSteel->id], [
            'quantity' => 500,
            'rate' => 85,
            'gstPercent' => 18,
            'total' => 500 * 85 * 1.18
        ]);

        $grn = GRN::firstOrCreate(['grnNo' => 'GRN-001'], [
            'purchaseOrderId' => $po->id,
            'vendorId' => $vendor->id,
            'status' => 'Received',
            'createdBy' => 1,
        ]);
        GRNItem::firstOrCreate(['grnId' => $grn->id, 'productId' => $rmSteel->id], [
            'quantity' => 500,
        ]);

        PurchaseBill::firstOrCreate(['billNo' => 'PB-001'], [
            'vendorId' => $vendor->id,
            'purchaseOrderId' => $po->id,
            'vendorInvoiceNo' => 'V-INV-001',
            'billDate' => now(),
            'dueDate' => now()->addDays(15),
            'taxableValue' => 42500,
            'cgstAmount' => 3825,
            'sgstAmount' => 3825,
            'igstAmount' => 0,
            'grandTotal' => 50150,
            'status' => 'Unpaid',
            'createdBy' => 1,
        ]);

        echo "✅ Purchase cycle data created (POs, GRNs, Bills)\n";

        $receiptTable = (new SalesReceiptVoucher())->getTable();
        $receiptPayload = [
            'customerId' => $customer->id,
            'invoiceId' => $invoice->id,
            'receiptDate' => now(),
            'amount' => 120000,
            'paymentMode' => 'Bank',
            'createdBy' => 1,
        ];

        if (Schema::hasColumn($receiptTable, 'referenceNo')) {
            $receiptPayload['referenceNo'] = 'UTR-RV001';
        }
        if (Schema::hasColumn($receiptTable, 'remarks')) {
            $receiptPayload['remarks'] = 'Part payment against INV-001';
        }

        SalesReceiptVoucher::firstOrCreate(['receiptNo' => 'RV-001'], $receiptPayload);
        echo "✅ Sales receipt voucher seeded\n";

        $bomTable = (new BOMHeader())->getTable();
        if (Schema::hasTable($bomTable)) {
            $existingBomId = BOMHeader::where('bomNo', 'BOM-001')->value('id');
            if (!$existingBomId) {
                $existingBomId = BOMHeader::create([
                    'bomNo' => 'BOM-001',
                    'productId' => $p1->id,
                    'version' => '1.0',
                    'effectiveFrom' => now(),
                    'isActive' => true,
                    'createdBy' => 1,
                ])->id;
            }

            $routeCard = ProductionRouteCard::firstOrCreate(['routeCardNo' => 'RC-001'], [
                'productId' => $p1->id,
                'bomHeaderId' => $existingBomId,
                'batchNo' => 'BATCH-01',
                'planQty' => 100,
                'actualQty' => 92,
                'status' => 'In Progress',
                'isActive' => true,
                'createdBy' => 1,
            ]);

            ProductionReport::firstOrCreate([
                'routeCardId' => $routeCard->id,
                'productId' => $p1->id,
                'reportDate' => now()->startOfDay(),
            ], [
                'productionQty' => 92,
                'rejectionQty' => 4,
                'remarks' => 'Seeded production report for dashboard/print',
                'createdBy' => 1,
            ]);

            JobOrder::firstOrCreate(['jobOrderNo' => 'JOB-001'], [
                'contractorName' => 'Tech Contractors',
                'processRequired' => 'CNC Machining',
                'status' => 'Open',
                'isActive' => true,
                'createdBy' => 1,
            ]);

            echo "✅ Production cycle data created (BOM, Route Card, Report, Job Order)\n";
        }

        // ══════════════════════════════════════════════════════════════════════
        // 4.5 BANK RECONCILIATION - Extended with more records
        // ══════════════════════════════════════════════════════════════════════
        $bankReconciliations = [
            // HDFC Bank records
            ['bankAccount' => 'HDFC Bank - Current A/c 1234', 'statementDate' => now()->subDays(60), 'systemBalance' => 980000.00, 'bankBalance' => 980000.00, 'status' => 'Reconciled', 'remarks' => 'Jan 2026 reconciliation complete'],
            ['bankAccount' => 'HDFC Bank - Current A/c 1234', 'statementDate' => now()->subDays(45), 'systemBalance' => 1250000.00, 'bankBalance' => 1250000.00, 'status' => 'Reconciled', 'remarks' => 'Feb mid-month reconciliation'],
            ['bankAccount' => 'HDFC Bank - Current A/c 1234', 'statementDate' => now()->subDays(30), 'systemBalance' => 1485000.00, 'bankBalance' => 1482500.00, 'status' => 'Pending', 'remarks' => 'Unreconciled: ₹2,500 cheque in transit'],
            ['bankAccount' => 'HDFC Bank - Current A/c 1234', 'statementDate' => now()->subDays(15), 'systemBalance' => 1620000.00, 'bankBalance' => 1618500.00, 'status' => 'Pending', 'remarks' => 'Bank charges pending adjustment'],
            ['bankAccount' => 'HDFC Bank - Current A/c 1234', 'statementDate' => now()->subDays(5), 'systemBalance' => 1750000.00, 'bankBalance' => 1750000.00, 'status' => 'Reconciled', 'remarks' => 'March 2026 reconciliation done'],
            // ICICI Bank records
            ['bankAccount' => 'ICICI Bank - Current A/c 5678', 'statementDate' => now()->subDays(60), 'systemBalance' => 720000.00, 'bankBalance' => 720000.00, 'status' => 'Reconciled', 'remarks' => 'Jan 2026 reconciliation done'],
            ['bankAccount' => 'ICICI Bank - Current A/c 5678', 'statementDate' => now()->subDays(45), 'systemBalance' => 875000.00, 'bankBalance' => 875000.00, 'status' => 'Reconciled', 'remarks' => 'All entries matched'],
            ['bankAccount' => 'ICICI Bank - Current A/c 5678', 'statementDate' => now()->subDays(30), 'systemBalance' => 923500.00, 'bankBalance' => 920000.00, 'status' => 'Pending', 'remarks' => 'Unreconciled: ₹3,500 bank charges pending'],
            ['bankAccount' => 'ICICI Bank - Current A/c 5678', 'statementDate' => now()->subDays(15), 'systemBalance' => 1050000.00, 'bankBalance' => 1050000.00, 'status' => 'Reconciled', 'remarks' => 'Reconciliation complete'],
            ['bankAccount' => 'ICICI Bank - Current A/c 5678', 'statementDate' => now()->subDays(3), 'systemBalance' => 1180000.00, 'bankBalance' => 1175000.00, 'status' => 'Pending', 'remarks' => 'Outstanding cheques ₹5,000'],
            // SBI Bank records
            ['bankAccount' => 'SBI - Current A/c 9012', 'statementDate' => now()->subDays(60), 'systemBalance' => 520000.00, 'bankBalance' => 520000.00, 'status' => 'Reconciled', 'remarks' => 'Jan 2026 fully matched'],
            ['bankAccount' => 'SBI - Current A/c 9012', 'statementDate' => now()->subDays(45), 'systemBalance' => 650000.00, 'bankBalance' => 650000.00, 'status' => 'Reconciled', 'remarks' => 'Feb 2026 reconciliation done'],
            ['bankAccount' => 'SBI - Current A/c 9012', 'statementDate' => now()->subDays(30), 'systemBalance' => 712500.00, 'bankBalance' => 710500.00, 'status' => 'Pending', 'remarks' => 'Unreconciled: ₹2,000 interest credit pending'],
            ['bankAccount' => 'SBI - Current A/c 9012', 'statementDate' => now()->subDays(15), 'systemBalance' => 830000.00, 'bankBalance' => 830000.00, 'status' => 'Reconciled', 'remarks' => 'All transactions matched'],
            ['bankAccount' => 'SBI - Current A/c 9012', 'statementDate' => now()->subDays(2), 'systemBalance' => 920000.00, 'bankBalance' => 918000.00, 'status' => 'Pending', 'remarks' => 'Pending deposit ₹2,000'],
        ];
        foreach ($bankReconciliations as $br) {
            BankReconciliation::updateOrCreate(
                ['bankAccount' => $br['bankAccount'], 'statementDate' => $br['statementDate']],
                array_merge($br, ['createdBy' => 1])
            );
        }
        echo "✅ Created " . count($bankReconciliations) . " bank reconciliation records\n";

        // ══════════════════════════════════════════════════════════════════════
        // 4.6 CREDIT CARD STATEMENT - Extended with more expense heads
        // ══════════════════════════════════════════════════════════════════════
        $creditCardStatements = [
            // HDFC Card - Various expense heads
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-01', 'transactionDate' => now()->subDays(55), 'merchant' => 'Dell India', 'amount' => 185000.00, 'expenseHead' => 'IT Equipment', 'description' => 'Laptop purchase for new hires'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-01', 'transactionDate' => now()->subDays(50), 'merchant' => 'Amazon Business', 'amount' => 45000.00, 'expenseHead' => 'Office Supplies', 'description' => 'Stationery and desk accessories'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(40), 'merchant' => 'Flipkart Wholesale', 'amount' => 32500.00, 'expenseHead' => 'IT Equipment', 'description' => 'Monitor and peripherals'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(35), 'merchant' => 'Indian Oil', 'amount' => 15000.00, 'expenseHead' => 'Fuel', 'description' => 'Company vehicle refuel'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(28), 'merchant' => 'MakeMyTrip', 'amount' => 58000.00, 'expenseHead' => 'Travel', 'description' => 'Flight tickets sales team'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(15), 'merchant' => 'Taj Hotels', 'amount' => 28500.00, 'expenseHead' => 'Travel & Accommodation', 'description' => 'Client meeting hotel stay'],
            ['cardNo' => 'HDFC-XXXX-1234', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(8), 'merchant' => 'Uber Business', 'amount' => 12000.00, 'expenseHead' => 'Travel', 'description' => 'Monthly cab charges'],
            // ICICI Card - Various expense heads
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-01', 'transactionDate' => now()->subDays(52), 'merchant' => 'Godrej Interio', 'amount' => 125000.00, 'expenseHead' => 'Furniture', 'description' => 'Office furniture purchase'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(38), 'merchant' => 'Eureka Forbes', 'amount' => 18000.00, 'expenseHead' => 'Maintenance', 'description' => 'Water purifier service'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(32), 'merchant' => 'Big Basket', 'amount' => 8500.00, 'expenseHead' => 'Pantry Supplies', 'description' => 'Monthly groceries'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(25), 'merchant' => 'Urban Company', 'amount' => 22000.00, 'expenseHead' => 'Maintenance', 'description' => 'AC servicing all offices'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(12), 'merchant' => 'IndiGo Airlines', 'amount' => 42000.00, 'expenseHead' => 'Travel', 'description' => 'Flight tickets for management'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(5), 'merchant' => 'Reliance Digital', 'amount' => 65000.00, 'expenseHead' => 'IT Equipment', 'description' => 'Conference room display'],
            ['cardNo' => 'ICICI-XXXX-5678', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(2), 'merchant' => 'Swiggy Corporate', 'amount' => 15000.00, 'expenseHead' => 'Entertainment', 'description' => 'Team lunch orders'],
            // SBI Card - Various expense heads
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-01', 'transactionDate' => now()->subDays(58), 'merchant' => 'HP India', 'amount' => 125000.00, 'expenseHead' => 'IT Equipment', 'description' => 'Printer and accessories'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-01', 'transactionDate' => now()->subDays(48), 'merchant' => 'CBRE Services', 'amount' => 95000.00, 'expenseHead' => 'Maintenance', 'description' => 'Annual maintenance contract'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(42), 'merchant' => 'Cafe Coffee Day', 'amount' => 5500.00, 'expenseHead' => 'Entertainment', 'description' => 'Client refreshments'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(30), 'merchant' => 'Airtel Business', 'amount' => 35000.00, 'expenseHead' => 'Telecom', 'description' => 'Internet and phone bills'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-02', 'transactionDate' => now()->subDays(22), 'merchant' => 'Staples India', 'amount' => 28000.00, 'expenseHead' => 'Office Supplies', 'description' => 'Bulk stationery purchase'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(10), 'merchant' => 'Microsoft India', 'amount' => 150000.00, 'expenseHead' => 'Software', 'description' => 'Office 365 annual subscription'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(4), 'merchant' => 'BHIM Petrol', 'amount' => 18000.00, 'expenseHead' => 'Fuel', 'description' => 'Fleet vehicle fuel'],
            ['cardNo' => 'SBI-XXXX-9012', 'statementMonth' => '2026-03', 'transactionDate' => now()->subDays(1), 'merchant' => 'Zomato Business', 'amount' => 8500.00, 'expenseHead' => 'Entertainment', 'description' => 'Team celebration dinner'],
        ];
        foreach ($creditCardStatements as $cc) {
            CreditCardStatement::updateOrCreate(
                ['cardNo' => $cc['cardNo'], 'transactionDate' => $cc['transactionDate'], 'merchant' => $cc['merchant']],
                array_merge($cc, ['createdBy' => 1])
            );
        }
        echo "✅ Created " . count($creditCardStatements) . " credit card statement records\n";

        echo "\n🎉 All synthetic test data seeded successfully!\n";
    }
}
