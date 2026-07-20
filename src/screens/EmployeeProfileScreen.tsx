import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useColorScheme, TextInput, Linking, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, User, CreditCard, Briefcase, Calendar, Users, FileText, Trash2, Upload, Eye, X, Check, Info, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from '../utils/api';
import tw from 'twrnc';

type ProfileTab = 'personal' | 'documents' | 'statutory' | 'salary' | 'shifts' | 'team';

export default function EmployeeProfileScreen({ route, navigation }: any) {
    const { id } = route.params || {};
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const arrowColor = isDark ? '#ffffff' : '#1e293b';

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<any>(null);
    const [customAssignments, setCustomAssignments] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<ProfileTab>('statutory'); // Start at Statutory & Bank Info matching web default tab

    // Edit Profile States
    const [isEditing, setIsEditing] = useState(false);
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formDob, setFormDob] = useState('');
    const [formBloodGroup, setFormBloodGroup] = useState('');
    const [formAddress, setFormAddress] = useState('');

    // Statutory & Bank Info States
    const [formPan, setFormPan] = useState('');
    const [formAadhaar, setFormAadhaar] = useState('');
    const [formUan, setFormUan] = useState('');
    const [formEsic, setFormEsic] = useState('');

    const [formBankName, setFormBankName] = useState('');
    const [formAccountNumber, setFormAccountNumber] = useState('');
    const [formIfscCode, setFormIfscCode] = useState('');

    // Salary Info State
    const [formBasicSalary, setFormBasicSalary] = useState('');

    // Custom Fields mapping
    const [formCustomFields, setFormCustomFields] = useState<Record<number, string>>({});

    // Custom Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [docToFieldId, setDocToFieldId] = useState<number | null>(null);
    const [docToFieldName, setDocToFieldName] = useState('');

    // Payslip States
    const [showPayslipModal, setShowPayslipModal] = useState(false);
    const [selectedPayslipMonth, setSelectedPayslipMonth] = useState<number>(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.getMonth();
    });
    const [selectedPayslipYear, setSelectedPayslipYear] = useState<number>(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.getFullYear();
    });
    const [tempPayslipMonth, setTempPayslipMonth] = useState<number>(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.getMonth();
    });
    const [tempPayslipYear, setTempPayslipYear] = useState<number>(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.getFullYear();
    });
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [payslipError, setPayslipError] = useState('');

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const employeeId = id || 'me';
            const endpoint = id ? `/employee/${id}` : '/employee/me';
            const leavesEndpoint = id ? `/leave/history?employeeId=${id}` : '/leave/history';

            const [profileRes, customRes, leavesRes] = await Promise.all([
                api.get(endpoint),
                api.get(`/custom-fields/employee/${employeeId}`),
                api.get(leavesEndpoint)
            ]);

            setEmployee(profileRes.data);
            setCustomAssignments(Array.isArray(customRes.data) ? customRes.data : []);
            setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
        } catch (error) {
            console.error('Error fetching employee, custom fields, and leaves:', error);
            Alert.alert('Error', 'Failed to load employee profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
    }, [id]);

    const startEditing = () => {
        if (!employee) return;
        const prof = employee.employeeProfile || {};
        const stat = prof.statutory || {};
        const bank = prof.bank || {};
        const sal = prof.salary || {};

        setFormName(employee.name || '');
        setFormPhone(prof.phone || '');
        setFormDob(prof.dob ? new Date(prof.dob).toISOString().split('T')[0] : '');
        setFormBloodGroup(prof.bloodGroup || '');
        setFormAddress(prof.address || '');

        setFormPan(stat.panNumber || '');
        setFormAadhaar(stat.aadhaarNumber || '');
        setFormUan(stat.uanNumber || '');
        setFormEsic(stat.esicNumber || '');

        setFormBankName(bank.bankName || '');
        setFormAccountNumber(bank.accountNumber || '');
        setFormIfscCode(bank.ifscCode || '');

        setFormBasicSalary(sal.basic ? sal.basic.toString() : '');

        // Map custom assignments values
        const customValues: Record<number, string> = {};
        customAssignments.forEach(ca => {
            customValues[ca.fieldId] = ca.value || '';
        });
        setFormCustomFields(customValues);

        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const employeeId = id || 'me';
            const endpoint = id ? `/employee/${id}` : '/employee/me';

            // Build profileData structure matching backend expectations
            const profileData = {
                name: formName.trim(),
                email: employee.email,
                phone: formPhone.trim(),
                dob: formDob ? new Date(formDob).toISOString() : null,
                bloodGroup: formBloodGroup.trim(),
                address: formAddress.trim(),

                // Statutory
                pan: formPan.trim(),
                aadhaar: formAadhaar.trim(),
                uan: formUan.trim(),
                esic: formEsic.trim(),

                // Bank
                bankName: formBankName.trim(),
                accountNumber: formAccountNumber.trim(),
                ifsc: formIfscCode.trim(),

                // Salary
                salary: formBasicSalary ? { basic: Number(formBasicSalary) } : undefined
            };

            await api.put(endpoint, profileData);

            // Save custom fields
            const customFieldsPayload = Object.keys(formCustomFields).reduce((acc: any, key) => {
                acc[key] = formCustomFields[Number(key)];
                return acc;
            }, {});
            const customFieldsEndpoint = id ? `/custom-fields/employee/${id}` : '/custom-fields/employee/me';
            await api.put(customFieldsEndpoint, { customFields: customFieldsPayload });

            Alert.alert('Success', 'Profile updated successfully!');
            setIsEditing(false);
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save profile changes');
            setLoading(false);
        }
    };

    const handleUploadDocument = async (fieldId: number) => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (res.canceled || !res.assets || res.assets.length === 0) {
                return;
            }

            const asset = res.assets[0];
            const employeeId = id || 'me';

            setLoading(true);

            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: asset.name || 'document.pdf',
                type: asset.mimeType || 'application/pdf',
            } as any);

            await api.post(`/custom-fields/employee/${employeeId}/field/${fieldId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Document uploaded successfully!');
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to upload document:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload document');
            setLoading(false);
        }
    };

    const handleDeleteDocument = (fieldId: number, fieldName: string) => {
        setDocToFieldId(fieldId);
        setDocToFieldName(fieldName);
        setShowDeleteModal(true);
    };

    const confirmDeleteDocument = async () => {
        if (docToFieldId === null) return;
        try {
            setShowDeleteModal(false);
            setLoading(true);
            const employeeId = id || 'me';
            await api.delete(`/custom-fields/employee/${employeeId}/field/${docToFieldId}/document`);
            Alert.alert('Success', 'Document deleted successfully!');
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to delete document:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete document');
            setLoading(false);
        } finally {
            setDocToFieldId(null);
            setDocToFieldName('');
        }
    };

    const handleViewDocument = async (documentUrl: string) => {
        try {
            const hostUrl = api.defaults.baseURL?.replace('/api', '') || '';
            const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${hostUrl}${documentUrl}`;
            const encodedUrl = encodeURI(fullUrl);
            await Linking.openURL(encodedUrl);
        } catch (error) {
            console.error('Failed to open URL:', error);
            const hostUrl = api.defaults.baseURL?.replace('/api', '') || '';
            const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${hostUrl}${documentUrl}`;
            try {
                await Sharing.shareAsync(encodeURI(fullUrl));
            } catch (shareErr) {
                Alert.alert('Error', 'Failed to view or share document');
            }
        }
    };

    const calculateSalaryDetails = (selectedMonth: number, selectedYear: number) => {
        if (!employee) return null;

        const prof = employee.employeeProfile || {};
        const statutory = prof.statutory || {};
        const bank = prof.bank || {};
        const salary = prof.salary || {};
        const basic = Number(salary.basic || 0);

        const calendarDays = new Date(
            selectedYear,
            selectedMonth + 1,
            0
        ).getDate();

        const joiningDateForSalary = prof.joiningDate
            ? new Date(prof.joiningDate)
            : null;

        let payableDays = calendarDays;

        if (
            joiningDateForSalary &&
            joiningDateForSalary.getFullYear() === selectedYear &&
            joiningDateForSalary.getMonth() === selectedMonth
        ) {
            payableDays = calendarDays - joiningDateForSalary.getDate() + 1;
        }

        // Calculate LWP days for selected month from approved leaves
        let lwpDays = 0;
        if (Array.isArray(leaves)) {
            leaves.forEach((leave: any) => {
                const isApproved = String(leave.status).toUpperCase() === 'APPROVED';
                const isLWP = leave.leaveType?.code === 'LWP';

                if (!isApproved || !isLWP) return;

                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const current = new Date(start);

                while (current <= end) {
                    if (
                        current.getFullYear() === selectedYear &&
                        current.getMonth() === selectedMonth
                    ) {
                        lwpDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }
            });
        }

        let paidLeaveBreakdown: Record<string, number> = {};
        let paidLeaveDays = 0;

        if (Array.isArray(leaves)) {
            leaves.forEach((leave: any) => {
                const isApproved = String(leave.status).toUpperCase() === 'APPROVED';
                const leaveCode = leave.leaveType?.code || leave.leaveType?.name || 'Leave';
                const isLWP = String(leaveCode).toUpperCase() === 'LWP';

                if (!isApproved || isLWP) return;

                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const current = new Date(start);

                while (current <= end) {
                    if (
                        current.getFullYear() === selectedYear &&
                        current.getMonth() === selectedMonth
                    ) {
                        paidLeaveDays++;
                        paidLeaveBreakdown[leaveCode] =
                            (paidLeaveBreakdown[leaveCode] || 0) + 1;
                    }
                    current.setDate(current.getDate() + 1);
                }
            });
        }

        const paidLeaveText = Object.entries(paidLeaveBreakdown)
            .map(([type, days]) => `${type}: ${days}`)
            .join(', ');

        const paidDays = Math.max(0, payableDays - lwpDays);
        const paidBasic = Number(((basic / calendarDays) * payableDays).toFixed(2));

        // Get salary components (earnings vs deductions)
        const selectedSalaryComponents = (() => {
            const backendComponents =
                Array.isArray(prof.selectedSalaryComponents) && prof.selectedSalaryComponents.length > 0
                    ? prof.selectedSalaryComponents
                    : Array.isArray(prof.salaryComponents) && prof.salaryComponents.length > 0
                        ? prof.salaryComponents
                        : Array.isArray(prof.salary?.selectedSalaryComponents) && prof.salary.selectedSalaryComponents.length > 0
                            ? prof.salary.selectedSalaryComponents
                            : [];
            return backendComponents.map((item: any) =>
                item.component ? item.component : item
            );
        })();

        const earningsComponents = selectedSalaryComponents.filter(
            (component: any) => component.type === 'EARNING'
        );

        const deductionComponents = selectedSalaryComponents.filter(
            (component: any) => component.type === 'DEDUCTION'
        );

        const getPayslipComponentAmount = (component: any) => {
            const value = Number(component.value || 0);

            if (component.calculationType === 'FLAT') {
                return Number(((value / calendarDays) * payableDays).toFixed(2));
            }

            if (component.calculationType === '%_BASIC') {
                return Number(((paidBasic * value) / 100).toFixed(2));
            }

            return Number(((value / calendarDays) * payableDays).toFixed(2));
        };

        const payslipEarningComponents = earningsComponents
            .map((component: any) => ({
                ...component,
                amount: getPayslipComponentAmount(component),
            }))
            .filter((component: any) => component.amount > 0);

        const payslipDeductionComponents = deductionComponents
            .map((component: any) => ({
                ...component,
                amount: getPayslipComponentAmount(component),
            }))
            .filter((component: any) => component.amount > 0);

        const totalPayslipEarningComponents = payslipEarningComponents.reduce(
            (sum: number, component: any) => sum + Number(component.amount || 0),
            0
        );

        const totalPayslipDeductionComponents = payslipDeductionComponents.reduce(
            (sum: number, component: any) => sum + Number(component.amount || 0),
            0
        );

        const totalEarnings = Number((paidBasic + totalPayslipEarningComponents).toFixed(2));
        const perDayEarning = payableDays > 0 ? totalEarnings / payableDays : 0;
        const lwpDeduction =
            lwpDays > 0 ? Number((perDayEarning * lwpDays).toFixed(2)) : 0;

        const totalDeductions = Number(
            (totalPayslipDeductionComponents + lwpDeduction).toFixed(2)
        );

        const totalSalary = Math.max(
            0,
            Number((totalEarnings - totalDeductions).toFixed(2))
        );

        // Validation / Block Message check
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const selectedMonthStart = new Date(selectedYear, selectedMonth, 1);
        const joiningDateRaw = prof.joiningDate ? new Date(prof.joiningDate) : null;

        const hasCompletedOneMonth = joiningDateRaw
            ? new Date(
                joiningDateRaw.getFullYear(),
                joiningDateRaw.getMonth() + 1,
                joiningDateRaw.getDate()
            ) <= today
            : true;

        const joiningMonthStart = joiningDateRaw
            ? new Date(joiningDateRaw.getFullYear(), joiningDateRaw.getMonth(), 1)
            : null;

        const isCurrentMonth =
            selectedMonthStart.getMonth() === currentMonthStart.getMonth() &&
            selectedMonthStart.getFullYear() === currentMonthStart.getFullYear();

        const isFutureMonth = selectedMonthStart > currentMonthStart;

        const isBeforeJoiningMonth =
            joiningMonthStart && selectedMonthStart < joiningMonthStart;

        let payslipBlockMessage = '';

        if (isBeforeJoiningMonth) {
            payslipBlockMessage =
                'No salary slip is available because you were not employed during the selected month.';
        } else if (!hasCompletedOneMonth) {
            payslipBlockMessage =
                'Salary slip will be available after you complete one full month of service.';
        } else if (isCurrentMonth) {
            payslipBlockMessage =
                'Salary slip for the current month is not available yet. Please select a completed past month.';
        } else if (isFutureMonth) {
            payslipBlockMessage =
                'Salary slip cannot be generated for a future month. Please select a completed past month.';
        }

        const selectedMonthLabel = new Date(selectedYear, selectedMonth, 1)
            .toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const selectedMonthShort = new Date(selectedYear, selectedMonth, 1)
            .toLocaleString('en-US', { month: 'short', year: 'numeric' })
            .replace(' ', '_');

        return {
            calendarDays,
            paidDays,
            lwpDays,
            paidLeaveDays,
            paidLeaveText,
            paidBasic,
            payslipEarningComponents,
            payslipDeductionComponents,
            totalEarnings,
            totalDeductions,
            lwpDeduction,
            totalSalary,
            payslipBlockMessage,
            selectedMonthLabel,
            selectedMonthShort,
            prof,
            statutory,
            bank,
        };
    };

    const exportPayslipPDF = async (month: number, year: number) => {
        const details = calculateSalaryDetails(month, year);
        if (!details) return;

        if (details.payslipBlockMessage) {
            Alert.alert("Cannot Generate Payslip", details.payslipBlockMessage);
            return;
        }

        const joiningDateFormatted = details.prof.joiningDate
            ? new Date(details.prof.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A';

        const dobFormatted = details.prof.dob
            ? new Date(details.prof.dob).toLocaleDateString('en-IN')
            : 'N/A';

        const earningsHtml = details.payslipEarningComponents.map((c: any) => `
            <div class="row">
                <span>${c.name}</span>
                <span class="bold">₹ ${Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        `).join('');

        const deductionsHtml = details.payslipDeductionComponents.map((c: any) => `
            <div class="row">
                <span>${c.name}</span>
                <span class="bold">₹ ${Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        `).join('');

        const paidLeavesHtml = details.paidLeaveDays > 0 ? `
            <div class="row green-bg">
                <span>Paid Leaves (${details.paidLeaveText || `${details.paidLeaveDays} days`})</span>
                <span class="bold green-text">₹ 0.00</span>
            </div>
        ` : '';

        const lwpHtml = details.lwpDeduction > 0 ? `
            <div class="row red-bg">
                <span class="bold red-text">LWP Deduction (${details.lwpDays} days)</span>
                <span class="bold red-text">₹ ${details.lwpDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        ` : '';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #1a202c;
                        background-color: #ffffff;
                        padding: 30px;
                        font-size: 13px;
                        line-height: 1.5;
                    }
                    .payslip-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        padding: 24px;
                        border-radius: 8px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #5b21b6;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .logo-section {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .logo {
                        width: 48px;
                        height: 48px;
                        background-color: #5b21b6;
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 20px;
                        border-radius: 6px;
                    }
                    .company-name {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .brand-color {
                        color: #8b5cf6;
                    }
                    .company-address {
                        text-align: right;
                        font-size: 11px;
                        color: #4a5568;
                    }
                    .company-address .bold {
                        font-weight: bold;
                        color: #2d3748;
                    }
                    .grid-2 {
                        display: flex;
                        justify-content: space-between;
                        gap: 24px;
                        margin-bottom: 20px;
                    }
                    .grid-section {
                        flex: 1;
                    }
                    .grid-title {
                        font-weight: bold;
                        color: #8b5cf6;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        border-bottom: 1px solid #edf2f7;
                        padding-bottom: 4px;
                        margin-bottom: 8px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 2fr;
                        gap: 6px;
                        font-size: 11px;
                    }
                    .label {
                        color: #718096;
                        font-weight: 500;
                    }
                    .value {
                        font-weight: bold;
                        color: #2d3748;
                    }
                    .summary-bar {
                        display: flex;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        overflow: hidden;
                        margin-bottom: 20px;
                        font-size: 11px;
                    }
                    .summary-item {
                        flex: 1;
                        background-color: #f7fafc;
                        padding: 8px;
                        text-align: center;
                        border-right: 1px solid #e2e8f0;
                    }
                    .summary-item:last-child {
                        border-right: none;
                    }
                    .summary-label {
                        color: #a0aec0;
                        font-weight: 500;
                        text-transform: uppercase;
                        font-size: 8px;
                        letter-spacing: 0.05em;
                    }
                    .summary-val {
                        font-weight: bold;
                        font-size: 13px;
                        margin-top: 2px;
                    }
                    .green-text {
                        color: #276749;
                    }
                    .table-container {
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        overflow: hidden;
                        margin-bottom: 20px;
                    }
                    .table-header {
                        display: flex;
                        background-color: #f7fafc;
                        border-bottom: 1px solid #e2e8f0;
                        font-weight: bold;
                        color: #4a5568;
                        text-transform: uppercase;
                        font-size: 10px;
                    }
                    .table-header-col {
                        flex: 1;
                        padding: 8px;
                        text-align: center;
                    }
                    .table-header-col:first-child {
                        border-right: 1px solid #e2e8f0;
                    }
                    .table-body {
                        display: flex;
                        min-height: 120px;
                        font-size: 11px;
                    }
                    .table-column {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .table-column:first-child {
                        border-right: 1px solid #e2e8f0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px;
                        border-bottom: 1px solid #f7fafc;
                    }
                    .bold {
                        font-weight: bold;
                    }
                    .green-bg {
                        background-color: #f0fff4;
                    }
                    .red-bg {
                        background-color: #fff5f5;
                    }
                    .red-text {
                        color: #9b2c2c;
                    }
                    .column-total {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px;
                        background-color: #f7fafc;
                        border-top: 1px solid #edf2f7;
                        font-weight: bold;
                        color: #2d3748;
                    }
                    .grand-total {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px;
                        background-color: #f7fafc;
                        border-top: 1px solid #e2e8f0;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    .footer-text {
                        text-align: center;
                        font-size: 9px;
                        color: #a0aec0;
                        margin-top: 20px;
                        border-top: 1px solid #edf2f7;
                        padding-top: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <div class="logo-section">
                            <div class="logo">EH</div>
                            <div class="company-name">EnCalm <span class="brand-color">HRX</span></div>
                        </div>
                        <div class="company-address">
                            <p class="bold">EncalmIT Consultancy Pvt. Ltd.</p>
                            <p>Gurgaon, Haryana, India</p>
                            <p>CIN: U12345HR2023PTC123456</p>
                        </div>
                    </div>

                    <div class="grid-2">
                        <div class="grid-section">
                            <div class="grid-title">Employee Details</div>
                            <div class="info-grid">
                                <span class="label">Name:</span>
                                <span class="value">${employee.name}</span>
                                <span class="label">Employee ID:</span>
                                <span class="value">${employee.id}</span>
                                <span class="label">Role:</span>
                                <span class="value">${details.prof.title || 'N/A'}</span>
                                <span class="label">Department:</span>
                                <span class="value">${details.prof.department || 'N/A'}</span>
                                <span class="label">DOB:</span>
                                <span class="value">${dobFormatted}</span>
                                <span class="label">Date of Joining:</span>
                                <span class="value">${joiningDateFormatted}</span>
                            </div>
                        </div>
                        <div class="grid-section">
                            <div class="grid-title">Bank & Pan Details</div>
                            <div class="info-grid">
                                <span class="label">Bank Name:</span>
                                <span class="value">${details.bank.bankName || 'N/A'}</span>
                                <span class="label">Account No:</span>
                                <span class="value">XXXX${(details.bank.accountNumber || '').slice(-4)}</span>
                                <span class="label">PAN Number:</span>
                                <span class="value">${details.statutory.pan || 'N/A'}</span>
                                <span class="label">UAN:</span>
                                <span class="value">${details.statutory.uan || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="summary-bar">
                        <div class="summary-item">
                            <span class="summary-label">Total Working Days</span>
                            <div class="summary-val">${details.calendarDays}</div>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Paid Days</span>
                            <div class="summary-val green-text">${details.paidDays}</div>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Leave Taken (LWP)</span>
                            <div class="summary-val" style="color: ${details.lwpDays > 0 ? '#9b2c2c' : '#2d3748'}">${details.lwpDays}</div>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="table-header">
                            <div class="table-header-col">Earnings</div>
                            <div class="table-header-col">Deductions</div>
                        </div>
                        <div class="table-body">
                            <div class="table-column">
                                <div>
                                    <div class="row">
                                        <span class="bold">Basic Salary</span>
                                        <span class="bold">₹ ${details.paidBasic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    ${earningsHtml}
                                </div>
                                <div class="column-total">
                                    <span>Total Earnings</span>
                                    <span>₹ ${details.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div class="table-column">
                                <div>
                                    ${deductionsHtml}
                                    ${paidLeavesHtml}
                                    ${lwpHtml}
                                </div>
                                <div class="column-total">
                                    <span>Total Deductions</span>
                                    <span>₹ ${details.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                        <div class="grand-total">
                            <span>Total Salary</span>
                            <span class="green-text">₹ ${details.totalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div class="footer-text">
                        <p>This is a computer-generated document and does not require a signature.</p>
                        <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to generate Payslip");
        }
    };

    const handleExportPayslip = () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        setSelectedPayslipMonth(lastMonth.getMonth());
        setSelectedPayslipYear(lastMonth.getFullYear());
        setTempPayslipMonth(lastMonth.getMonth());
        setTempPayslipYear(lastMonth.getFullYear());
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
        setPayslipError('');
        setShowPayslipModal(true);
    };

    if (loading) {
        return (
            <View style={tw`flex-1 items-center justify-center bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!employee) {
        return (
            <View style={tw`flex-1 items-center justify-center bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
                <Text style={tw`text-gray-500 font-bold`}>Employee Profile not found.</Text>
            </View>
        );
    }

    const profile = employee.employeeProfile || {};
    const initials = employee.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

    const renderDetailRow = (label: string, value: string | null | undefined) => (
        <View style={tw`flex-row justify-between py-3 border-b border-gray-50 dark:border-slate-700/50`}>
            <Text style={tw`text-xs font-bold text-gray-400 uppercase`}>{label}</Text>
            <Text style={tw`text-xs font-semibold text-gray-800 dark:text-white`}>{value || 'N/A'}</Text>
        </View>
    );

    const renderEditableDetailRow = (
        label: string,
        value: string | null | undefined,
        stateValue: string,
        onChangeText: (text: string) => void,
        placeholder?: string,
        keyboardType?: 'default' | 'number-pad' | 'email-address'
    ) => {
        if (isEditing) {
            return (
                <View style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                    <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>{label}</Text>
                    <TextInput
                        style={tw`w-full px-3 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-9`}
                        value={stateValue}
                        onChangeText={onChangeText}
                        placeholder={placeholder || `Enter ${label}`}
                        placeholderTextColor="#94a3b8"
                        keyboardType={keyboardType || 'default'}
                    />
                </View>
            );
        }
        return renderDetailRow(label, value);
    };

    const personalFields = customAssignments.filter(ca => ca.field?.category === 'PERSONAL_DETAILS');
    const documentFields = customAssignments.filter(ca => ca.field?.category === 'DOCUMENT_VAULT');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>

                {/* Header */}
                <View style={[
                    tw`flex-row items-center justify-between px-4 pb-4 bg-white dark:bg-[#4c1d95] border-b border-gray-100 dark:border-white/5`,
                    { paddingTop: insets.top + 16 }
                ]}>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                            <ArrowLeft size={20} color={arrowColor} />
                        </TouchableOpacity>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Employee Profile</Text>
                    </View>
                    <View style={tw`w-10`} /> {/* Balanced empty view after removing download button from header */}
                </View>

                <ScrollView style={tw`flex-grow`} showsVerticalScrollIndicator={false}>

                    {/* Profile Banner */}
                    <View style={tw`items-center py-6 bg-white dark:bg-[#4c1d95] border-b border-gray-100 dark:border-white/5 mb-4`}>
                        <View style={tw`w-20 h-20 rounded-3xl bg-[#ede9fe] dark:bg-[#8b5cf6] flex items-center justify-center mb-3 shadow-md shadow-[#8b5cf6]/20`}>
                            <Text style={tw`text-[#8b5cf6] dark:text-white font-extrabold text-2xl`}>{initials}</Text>
                        </View>

                        {isEditing ? (
                            <TextInput
                                style={tw`px-4 py-1.5 bg-[#f5f3ff] dark:bg-[#111827] border border-[#8b5cf6] rounded-xl text-base font-bold text-gray-900 dark:text-white text-center w-52 mb-1`}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="Employee Name"
                            />
                        ) : (
                            <Text style={tw`text-xl font-bold text-gray-900 dark:text-white`}>{employee.name}</Text>
                        )}

                        <Text style={tw`text-xs text-gray-550 dark:text-purple-200 mt-1`}>
                            {(employee.role && typeof employee.role === 'object' ? employee.role.name : employee.role) || 'HR_ADMIN'} - {profile.title || 'hr'}
                        </Text>

                        {/* Badges matching web */}
                        <View style={tw`flex-row gap-2 mt-3`}>
                            <View style={tw`px-2.5 py-0.5 bg-gray-50 dark:bg-white/10 rounded-full border border-gray-100 dark:border-white/5`}>
                                <Text style={tw`text-[10px] font-bold text-gray-500 dark:text-purple-200`}>ID: {employee.id}</Text>
                            </View>
                            <View style={tw`px-2.5 py-0.5 bg-gray-50 dark:bg-white/10 rounded-full border border-gray-100 dark:border-white/5`}>
                                <Text style={tw`text-[10px] font-bold text-gray-550 dark:text-purple-200`}>{profile.department || 'Head Office'}</Text>
                            </View>
                        </View>

                        {/* Edit Profile controls matching web */}
                        <View style={tw`flex-row gap-3 mt-4`}>
                            {isEditing ? (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(false)}
                                        style={tw`px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl`}
                                    >
                                        <Text style={tw`text-xs font-bold text-gray-600 dark:text-gray-300`}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        style={tw`px-4 py-2 bg-[#8b5cf6] rounded-xl flex-row items-center gap-1.5`}
                                    >
                                        <Text style={tw`text-xs font-bold text-white`}>Save Changes</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity
                                    onPress={startEditing}
                                    style={tw`px-4 py-2 bg-white/20 dark:bg-white/10 rounded-xl flex-row items-center gap-1.5 border border-white/10`}
                                >
                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>✏ Edit Profile</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Tab selectors */}
                    <View style={tw`bg-white dark:bg-[#4c1d95] py-3 border-b border-gray-100 dark:border-white/5 mb-4`}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row px-4`}>
                            {[
                                { key: 'statutory', label: 'Statutory & Bank Info', icon: CreditCard },
                                { key: 'documents', label: 'Document Vault', icon: FileText },
                                { key: 'personal', label: 'Personal Details', icon: User },
                                { key: 'shifts', label: 'Shift & Roster', icon: Calendar },
                                { key: 'salary', label: 'Salary Info', icon: Briefcase },
                                { key: 'team', label: 'Team Info', icon: Users },
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => setActiveTab(tab.key as ProfileTab)}
                                    style={tw`flex-row items-center gap-1.5 px-4 py-2 rounded-xl mr-2 ${activeTab === tab.key ? 'bg-[#8b5cf6]' : 'bg-gray-100 dark:bg-[#5b21b6]'}`}
                                >
                                    <tab.icon size={14} color={activeTab === tab.key ? '#fff' : (isDark ? '#e2e8f0' : '#64748b')} />
                                    <Text style={tw`text-xs font-bold ${activeTab === tab.key ? 'text-white' : 'text-gray-550 dark:text-gray-200'}`}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Tab content panel */}
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 mx-4 shadow-sm mb-6`}>

                        {activeTab === 'personal' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Personal Information</Text>
                                {renderEditableDetailRow('Phone', profile.phone, formPhone, setFormPhone, 'e.g. 1119299291', 'number-pad')}
                                {renderDetailRow('Email', employee.email)}
                                {renderEditableDetailRow('Date of Birth (YYYY-MM-DD)', profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '', formDob, setFormDob, 'YYYY-MM-DD')}
                                {renderDetailRow('Date of Joining', profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : '')}
                                {renderDetailRow('System Role', employee.role && typeof employee.role === 'object' ? employee.role.name : employee.role)}
                                {renderDetailRow('Designation', profile.title)}
                                {renderDetailRow('Department', profile.department)}
                                {renderEditableDetailRow('Blood Group', profile.bloodGroup, formBloodGroup, setFormBloodGroup, 'e.g. AB+')}
                                {renderEditableDetailRow('Address', profile.address, formAddress, setFormAddress, 'Enter home address')}

                                {/* Status Row */}
                                <View style={tw`flex-row justify-between py-3 border-b border-gray-50 dark:border-slate-700/20 items-center`}>
                                    <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase`}>Status</Text>
                                    <View style={tw`px-2.5 py-0.5 bg-green-100 dark:bg-green-950/40 rounded-full`}>
                                        <Text style={tw`text-[9px] font-bold text-green-700 dark:text-green-400 uppercase`}>
                                            {employee.status || 'ACTIVE'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Additional Custom Personal Details */}
                                {personalFields.length > 0 && (
                                    <View style={tw`mt-6 pt-4 border-t border-gray-100 dark:border-white/5`}>
                                        <Text style={tw`text-xs font-black text-gray-400 dark:text-purple-300 uppercase tracking-widest mb-3`}>Additional Details</Text>
                                        {personalFields.map(ca => {
                                            if (isEditing) {
                                                return (
                                                    <View key={ca.id} style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                                                        <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>{ca.field.name}</Text>
                                                        <TextInput
                                                            style={tw`w-full px-3 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-9`}
                                                            value={formCustomFields[ca.fieldId] || ''}
                                                            onChangeText={(text) => {
                                                                setFormCustomFields(prev => ({
                                                                    ...prev,
                                                                    [ca.fieldId]: text
                                                                }));
                                                            }}
                                                            placeholder={`Enter ${ca.field.name}`}
                                                            placeholderTextColor="#94a3b8"
                                                        />
                                                    </View>
                                                );
                                            }

                                            return renderDetailRow(ca.field?.name || 'Custom Field', ca.value || '');
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'documents' && (
                            <View>
                                <View style={tw`flex-row items-center gap-2 mb-4`}>
                                    <FileText size={18} color="#8b5cf6" />
                                    <Text style={tw`text-sm font-bold text-gray-900 dark:text-white`}>Document Vault</Text>
                                </View>

                                {documentFields.length > 0 ? (
                                    documentFields.map(ca => {
                                        return (
                                            <View key={ca.id} style={tw`bg-white/10 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 mb-3 flex-row items-center justify-between`}>
                                                <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
                                                    <View style={tw`p-2.5 bg-[#8b5cf6]/10 rounded-xl`}>
                                                        <FileText size={18} color="#8b5cf6" />
                                                    </View>
                                                    <View style={tw`flex-1`}>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                            {ca.field.name} <Text style={tw`text-red-500`}>*</Text>
                                                        </Text>
                                                        {ca.documentUrl ? (
                                                            <Text style={tw`text-[10px] text-green-650 dark:text-green-400 mt-1`} numberOfLines={1}>
                                                                {ca.documentName || 'Document Uploaded'}
                                                            </Text>
                                                        ) : (
                                                            <Text style={tw`text-[10px] text-gray-400 dark:text-purple-300 mt-1`}>
                                                                No document uploaded
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>

                                                <View style={tw`flex-row items-center gap-2`}>
                                                    {/* Upload Button in Edit Mode if no file exists */}
                                                    {isEditing && !ca.documentUrl && (
                                                        <TouchableOpacity
                                                            onPress={() => handleUploadDocument(ca.fieldId)}
                                                            style={tw`flex-row items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] rounded-xl mr-1`}
                                                        >
                                                            <Upload size={12} color="#fff" />
                                                            <Text style={tw`text-xs font-bold text-white`}>Upload</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* Eye view button styled exactly like web */}
                                                    {ca.documentUrl && (
                                                        <TouchableOpacity
                                                            onPress={() => handleViewDocument(ca.documentUrl)}
                                                            style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-[#8b5cf6]/10 dark:bg-white/10`}
                                                        >
                                                            <Eye size={18} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* Delete Button in Edit Mode if file exists */}
                                                    {isEditing && ca.documentUrl && (
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteDocument(ca.fieldId, ca.field.name)}
                                                            style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10`}
                                                        >
                                                            <Trash2 size={18} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={tw`text-xs text-gray-400 dark:text-purple-300 italic text-center py-6`}>No documents configured.</Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'statutory' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Statutory Details</Text>
                                {renderDetailRow('PAN Card', profile.statutory?.panNumber)}
                                {renderDetailRow('Aadhaar Number', profile.statutory?.aadhaarNumber)}
                                {renderDetailRow('UAN (PF)', profile.statutory?.uanNumber)}
                                {renderDetailRow('ESIC Number', profile.statutory?.esicNumber)}
                                {renderDetailRow('Bank Name', profile.bank?.bankName)}
                                {renderDetailRow('IFSC Code', profile.bank?.ifscCode)}
                                {renderDetailRow('Account Number', profile.bank?.accountNumber)}
                            </View>
                        )}

                        {activeTab === 'salary' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Salary Structure</Text>
                                {renderEditableDetailRow('Basic Monthly', profile.salary?.basic ? `INR ${profile.salary.basic}` : '0', formBasicSalary, setFormBasicSalary, 'Enter basic monthly salary', 'number-pad')}
                            </View>
                        )}

                        {activeTab === 'shifts' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Shift & Roster</Text>
                                <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-300 uppercase mb-3`}>Assigned Shift</Text>

                                <View style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5`}>
                                    <Text style={tw`text-base font-bold text-[#8b5cf6] mb-3 capitalize`}>{profile.shift?.name || 'morning'}</Text>

                                    <View style={tw`flex-row justify-between mb-2`}>
                                        <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Timing:</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                            {profile.shift?.inTime || '09:00'} - {profile.shift?.outTime || '18:00'}
                                        </Text>
                                    </View>

                                    <View style={tw`flex-row justify-between mb-2`}>
                                        <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Break:</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                            {profile.shift?.breakDuration ?? 60} mins
                                        </Text>
                                    </View>

                                    <View style={tw`flex-row justify-between mb-2`}>
                                        <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Grace Time:</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                            {profile.shift?.graceTime ?? 15} mins
                                        </Text>
                                    </View>

                                    <View style={tw`flex-row justify-between`}>
                                        <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Night Shift:</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                            {profile.shift?.isNightShift ? 'Yes' : 'No'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'team' && (
                            <View>
                                <View style={tw`flex-row items-center gap-2 mb-4`}>
                                    <Users size={18} color="#8b5cf6" />
                                    <Text style={tw`text-sm font-bold text-gray-900 dark:text-white`}>Team & Manager Details</Text>
                                </View>

                                {employee.teams && employee.teams.length > 0 ? (
                                    employee.teams.map((t: any, idx: number) => {
                                        return (
                                            <View key={idx} style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-3`}>
                                                <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-purple-300 uppercase mb-0.5`}>Team Name</Text>
                                                <Text style={tw`text-sm font-bold text-[#8b5cf6] mb-1`}>{t.name}</Text>
                                                {t.description ? <Text style={tw`text-xs text-gray-500 mb-3`}>{t.description}</Text> : null}

                                                <View style={tw`flex-row justify-between mb-2`}>
                                                    <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Name</Text>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.name || 'System Admin'}</Text>
                                                </View>

                                                <View style={tw`flex-row justify-between mb-2`}>
                                                    <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Email</Text>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.email || 'admin@example.com'}</Text>
                                                </View>

                                                <View style={tw`flex-row justify-between`}>
                                                    <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Phone</Text>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.employeeProfile?.phone || '1119299291'}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <View style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5`}>
                                        <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-purple-300 uppercase mb-0.5`}>Team Name</Text>
                                        <Text style={tw`text-sm font-bold text-[#8b5cf6] mb-1`}>Keshav</Text>
                                        {profile.department ? <Text style={tw`text-xs text-gray-500 mb-3`}>{profile.department}</Text> : null}

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Name</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>System Admin</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Email</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>admin@example.com</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between`}>
                                            <Text style={tw`text-xs text-gray-450 dark:text-purple-200`}>Team Manager Phone</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>1119299291</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                    </View>

                    {/* Quick Actions Panel */}
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 mx-4 shadow-sm mb-8`}>
                        <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Quick Actions</Text>
                        <TouchableOpacity
                            onPress={handleExportPayslip}
                            style={tw`flex-row items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/10 rounded-2xl mb-3 border border-gray-100 dark:border-white/5`}
                        >
                            <FileText size={18} color={isDark ? '#fff' : '#8b5cf6'} />
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>Generate Payslip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('ID Card', 'Generating ID Card preview...')}
                            style={tw`flex-row items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/10 rounded-2xl border border-gray-100 dark:border-white/5`}
                        >
                            <User size={18} color={isDark ? '#fff' : '#8b5cf6'} />
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>ID Card Preview</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>

                {/* Custom Delete Confirmation Modal matching webpage dialog exactly */}
                <Modal
                    visible={showDeleteModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDeleteModal(false)}
                >
                    <View style={tw`flex-1 justify-center items-center bg-black/60 p-6`}>
                        <View style={tw`bg-[#121127] w-full max-w-[320px] rounded-3xl p-6 items-center border border-white/10 shadow-2xl`}>

                            {/* Red Circle with Cross Icon */}
                            <View style={tw`w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4`}>
                                <X size={24} color="#ef4444" />
                            </View>

                            {/* Title */}
                            <Text style={tw`text-base font-bold text-white mb-2 text-center`}>Delete Document?</Text>

                            {/* Message */}
                            <Text style={tw`text-xs text-gray-400 text-center mb-6 leading-5`}>
                                Are you sure you want to delete <Text style={tw`font-bold text-white`}>{docToFieldName}</Text>?{'\n'}This action cannot be undone.
                            </Text>

                            {/* Action Buttons */}
                            <TouchableOpacity
                                onPress={confirmDeleteDocument}
                                style={tw`w-full py-3 bg-red-600 rounded-2xl mb-3 items-center`}
                            >
                                <Text style={tw`text-xs font-bold text-white`}>Yes, Delete</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowDeleteModal(false)}
                                style={tw`w-full py-3 bg-slate-800 rounded-2xl items-center`}
                            >
                                <Text style={tw`text-xs font-bold text-gray-300`}>Cancel</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </Modal>

                {/* Payslip Preview Modal matching webpage design and structure */}
                <Modal
                    visible={showPayslipModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowPayslipModal(false)}
                >
                    <View style={tw`flex-1 bg-black/85 justify-end md:justify-center p-0 md:p-6`}>
                        <View style={tw`bg-[#0f0c24] w-full max-w-3xl h-[85%] md:h-[80%] rounded-t-3xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl self-center`}>

                            {/* Modal Header Section with dropdown selectors */}
                            <View style={tw`relative z-40`}>
                                <View style={tw`px-4 py-3 bg-[#2d1266] flex-row justify-between items-center border-b border-white/10`}>
                                    <View style={tw`flex-1 mr-2`}>
                                        <Text style={tw`text-sm font-bold text-white`}>Payslip Preview</Text>
                                        <Text style={tw`text-[9px] text-purple-300 font-semibold mt-0.5`}>
                                            Payslip for {new Date(tempPayslipYear, tempPayslipMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                        </Text>
                                    </View>

                                    <View style={tw`flex-row items-center gap-1.5`}>
                                        {/* Month Selector Dropdown */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowMonthDropdown(!showMonthDropdown);
                                                setShowYearDropdown(false);
                                            }}
                                            style={tw`bg-[#4c1d95] border border-[#7c3aed] px-2.5 py-1.5 rounded-lg flex-row items-center gap-1`}
                                        >
                                            <Text style={tw`text-[10px] font-bold text-white`}>
                                                {new Date(2000, tempPayslipMonth, 1).toLocaleString('en-US', { month: 'long' })}
                                            </Text>
                                            <ChevronDown size={10} color="#fff" />
                                        </TouchableOpacity>

                                        {/* Year Selector Dropdown */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowYearDropdown(!showYearDropdown);
                                                setShowMonthDropdown(false);
                                            }}
                                            style={tw`bg-[#4c1d95] border border-[#7c3aed] px-2.5 py-1.5 rounded-lg flex-row items-center gap-1`}
                                        >
                                            <Text style={tw`text-[10px] font-bold text-white`}>{tempPayslipYear}</Text>
                                            <ChevronDown size={10} color="#fff" />
                                        </TouchableOpacity>

                                        {/* Apply Button */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedPayslipMonth(tempPayslipMonth);
                                                setSelectedPayslipYear(tempPayslipYear);
                                                setShowMonthDropdown(false);
                                                setShowYearDropdown(false);
                                            }}
                                            style={tw`bg-[#7c3aed] px-3.5 py-1.5 rounded-lg`}
                                        >
                                            <Text style={tw`text-[10px] font-bold text-white`}>Apply</Text>
                                        </TouchableOpacity>

                                        {/* Close Button */}
                                        <TouchableOpacity
                                            onPress={() => setShowPayslipModal(false)}
                                            style={tw`p-1.5 bg-white/10 rounded-full ml-1`}
                                        >
                                            <X size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Dropdown Options Overlays */}
                                {showMonthDropdown && (
                                    <View style={[tw`absolute bg-[#1e1b4b] border border-[#7c3aed] rounded-xl shadow-2xl z-50 w-28`, { top: 46, right: 130 }]}>
                                        <ScrollView style={tw`max-h-48`} nestedScrollEnabled>
                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                                                <TouchableOpacity
                                                    key={m}
                                                    onPress={() => {
                                                        setTempPayslipMonth(idx);
                                                        setShowMonthDropdown(false);
                                                    }}
                                                    style={tw`px-3 py-2 border-b border-purple-950/20`}
                                                >
                                                    <Text style={tw`text-[11px] font-bold text-white`}>{m}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {showYearDropdown && (
                                    <View style={[tw`absolute bg-[#1e1b4b] border border-[#7c3aed] rounded-xl shadow-2xl z-50 w-20`, { top: 46, right: 80 }]}>
                                        <ScrollView style={tw`max-h-32`} nestedScrollEnabled>
                                            {[2024, 2025, 2026, 2027].map((yr) => (
                                                <TouchableOpacity
                                                    key={yr}
                                                    onPress={() => {
                                                        setTempPayslipYear(yr);
                                                        setShowYearDropdown(false);
                                                    }}
                                                    style={tw`px-3 py-2 border-b border-purple-950/20`}
                                                >
                                                    <Text style={tw`text-[11px] font-bold text-white`}>{yr}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Modal Body / Payslip Preview Container */}
                            <ScrollView style={tw`flex-1 p-5 bg-[#0f0c24]`} contentContainerStyle={tw`pb-8`}>
                                {(() => {
                                    const details = calculateSalaryDetails(selectedPayslipMonth, selectedPayslipYear);
                                    if (!details) return null;

                                    if (details.payslipBlockMessage) {
                                        return (
                                            <View style={tw`flex-1 items-center justify-center py-10 px-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl`}>
                                                <Info size={36} color="#c084fc" style={tw`mb-3`} />
                                                <Text style={tw`text-center text-sm font-semibold text-gray-300 leading-6`}>
                                                    {details.payslipBlockMessage}
                                                </Text>
                                            </View>
                                        );
                                    }

                                    const joiningDateFormatted = details.prof.joiningDate
                                        ? new Date(details.prof.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'N/A';

                                    const dobFormatted = details.prof.dob
                                        ? new Date(details.prof.dob).toLocaleDateString('en-IN')
                                        : 'N/A';

                                    return (
                                        <View style={tw`bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative text-gray-900`}>

                                            {/* Company Header */}
                                            <View style={tw`flex-row justify-between items-start border-b-2 border-purple-900 pb-3 mb-4`}>
                                                <View style={tw`flex-row items-center gap-2.5`}>
                                                    <View style={tw`w-11 h-11 bg-purple-900 items-center justify-center rounded-lg shadow-sm`}>
                                                        <Text style={tw`text-white font-bold text-lg`}>EH</Text>
                                                    </View>
                                                    <View>
                                                        <Text style={tw`text-base font-black text-gray-900`}>EnCalm <Text style={tw`text-[#8b5cf6]`}>HRX</Text></Text>
                                                    </View>
                                                </View>
                                                <View style={tw`items-end`}>
                                                    <Text style={tw`font-bold text-[9px] text-gray-800`}>EncalmIT Consultancy Pvt. Ltd.</Text>
                                                    <Text style={tw`text-[8px] text-gray-500 mt-0.5`}>Gurgaon, Haryana, India</Text>
                                                    <Text style={tw`text-[8px] text-gray-500`}>CIN: U12345HR2023PTC123456</Text>
                                                </View>
                                            </View>

                                            {/* Employee & Bank Info Block */}
                                            <View style={tw`flex-row justify-between gap-4 mb-4`}>
                                                {/* Column 1 */}
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`font-bold text-[#8b5cf6] text-[8px] uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1`}>Employee Details</Text>
                                                    <View style={tw`gap-1`}>
                                                        <Text style={tw`text-[10px] text-gray-500`}>Name: <Text style={tw`font-bold text-gray-800`}>{employee.name}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>ID: <Text style={tw`font-bold text-gray-800`}>{employee.id}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>Role: <Text style={tw`font-bold text-gray-800`}>{details.prof.title || 'N/A'}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>Dept: <Text style={tw`font-bold text-gray-800`}>{details.prof.department || 'N/A'}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>DOB: <Text style={tw`font-bold text-gray-800`}>{dobFormatted}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>DOJ: <Text style={tw`font-bold text-gray-800`}>{joiningDateFormatted}</Text></Text>
                                                    </View>
                                                </View>

                                                {/* Column 2 */}
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`font-bold text-[#8b5cf6] text-[8px] uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1`}>Bank & Pan Details</Text>
                                                    <View style={tw`gap-1`}>
                                                        <Text style={tw`text-[10px] text-gray-500`}>Bank Name: <Text style={tw`font-bold text-gray-800`}>{details.bank.bankName || 'N/A'}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>Account No: <Text style={tw`font-bold text-gray-800`}>XXXX{(details.bank.accountNumber || '').slice(-4)}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>PAN: <Text style={tw`font-bold text-gray-800`}>{details.statutory.pan || 'N/A'}</Text></Text>
                                                        <Text style={tw`text-[10px] text-gray-500`}>UAN: <Text style={tw`font-bold text-gray-800`}>{details.statutory.uan || 'N/A'}</Text></Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Payroll Summary metrics */}
                                            <View style={tw`flex-row border border-gray-200 rounded-xl overflow-hidden mb-4 text-center`}>
                                                <View style={tw`flex-1 bg-gray-50 py-2 border-r border-gray-200`}>
                                                    <Text style={tw`text-[8px] text-gray-400 font-bold uppercase`}>Working Days</Text>
                                                    <Text style={tw`font-bold text-gray-700 text-xs mt-0.5`}>{details.calendarDays}</Text>
                                                </View>
                                                <View style={tw`flex-1 bg-gray-50 py-2 border-r border-gray-200`}>
                                                    <Text style={tw`text-[8px] text-gray-400 font-bold uppercase`}>Paid Days</Text>
                                                    <Text style={tw`font-bold text-green-600 text-xs mt-0.5`}>{details.paidDays}</Text>
                                                </View>
                                                <View style={tw`flex-1 bg-gray-50 py-2`}>
                                                    <Text style={tw`text-[8px] text-gray-400 font-bold uppercase`}>Leave (LWP)</Text>
                                                    <Text style={tw`font-bold text-xs mt-0.5 ${details.lwpDays > 0 ? 'text-red-500' : 'text-gray-700'}`}>{details.lwpDays}</Text>
                                                </View>
                                            </View>

                                            {/* Earnings vs Deductions Table layout */}
                                            <View style={tw`border border-gray-200 rounded-xl overflow-hidden mb-4`}>
                                                <View style={tw`flex-row bg-gray-50 border-b border-gray-200`}>
                                                    <Text style={tw`flex-1 py-1.5 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-gray-200`}>Earnings</Text>
                                                    <Text style={tw`flex-1 py-1.5 font-bold text-gray-700 text-[10px] uppercase text-center`}>Deductions</Text>
                                                </View>

                                                <View style={tw`flex-row min-h-[100px]`}>
                                                    {/* Left Column (Earnings) */}
                                                    <View style={tw`flex-1 border-r border-gray-200 justify-between`}>
                                                        <View>
                                                            <View style={tw`flex-row justify-between p-2 border-b border-gray-50`}>
                                                                <Text style={tw`text-[10px] text-gray-600 font-semibold`}>Basic Salary</Text>
                                                                <Text style={tw`text-[10px] font-bold text-gray-800`}>
                                                                    ₹{details.paidBasic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </Text>
                                                            </View>
                                                            {details.payslipEarningComponents.map((c: any, index: number) => (
                                                                <View key={index} style={tw`flex-row justify-between p-2 border-b border-gray-50`}>
                                                                    <Text style={tw`text-[10px] text-gray-500`}>{c.name}</Text>
                                                                    <Text style={tw`text-[10px] font-bold text-gray-800`}>
                                                                        ₹{Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                        <View style={tw`flex-row justify-between p-2 bg-gray-50 border-t border-gray-100`}>
                                                            <Text style={tw`text-[10px] font-bold text-gray-800`}>Total Earnings</Text>
                                                            <Text style={tw`text-[10px] font-bold text-gray-800`}>
                                                                ₹{details.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Right Column (Deductions) */}
                                                    <View style={tw`flex-1 justify-between`}>
                                                        <View>
                                                            {details.payslipDeductionComponents.map((c: any, index: number) => (
                                                                <View key={index} style={tw`flex-row justify-between p-2 border-b border-gray-50`}>
                                                                    <Text style={tw`text-[10px] text-gray-500`}>{c.name}</Text>
                                                                    <Text style={tw`text-[10px] font-bold text-gray-800`}>
                                                                        ₹{Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                            {details.paidLeaveDays > 0 && (
                                                                <View style={tw`flex-row justify-between p-2 border-b border-gray-50 bg-green-50/25`}>
                                                                    <Text style={tw`text-[9px] text-green-700`}>Paid Leaves ({details.paidLeaveText || `${details.paidLeaveDays} d`})</Text>
                                                                    <Text style={tw`text-[9px] font-bold text-green-700`}>₹0.00</Text>
                                                                </View>
                                                            )}
                                                            {details.lwpDeduction > 0 && (
                                                                <View style={tw`flex-row justify-between p-2 border-b border-gray-50 bg-red-50`}>
                                                                    <Text style={tw`text-[9px] font-bold text-red-500`}>LWP Deduct ({details.lwpDays} d)</Text>
                                                                    <Text style={tw`text-[9px] font-bold text-red-500`}>
                                                                        ₹{details.lwpDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            {details.totalDeductions === 0 && (
                                                                <Text style={tw`text-center py-4 text-[9px] text-gray-400 italic`}>No deductions</Text>
                                                            )}
                                                        </View>
                                                        <View style={tw`flex-row justify-between p-2 bg-gray-50 border-t border-gray-100`}>
                                                            <Text style={tw`text-[10px] font-bold text-gray-800`}>Total Deduct</Text>
                                                            <Text style={tw`text-[10px] font-bold text-gray-800`}>
                                                                ₹{details.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={tw`flex-row justify-between p-2.5 bg-gray-50 border-t border-gray-200 font-bold`}>
                                                    <Text style={tw`text-xs font-bold text-gray-900`}>Total Salary (Net)</Text>
                                                    <Text style={tw`text-xs font-black text-green-600`}>
                                                        ₹{details.totalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Footer Disclaimer */}
                                            <Text style={tw`text-center text-[7.5px] text-gray-400 leading-4 mt-2 border-t border-gray-100 pt-2`}>
                                                This is a computer-generated document and does not require a signature.{'\n'}Generated on {new Date().toLocaleDateString()}
                                            </Text>

                                        </View>
                                    );
                                })()}
                            </ScrollView>

                            {/* Footer Buttons */}
                            {(() => {
                                const details = calculateSalaryDetails(selectedPayslipMonth, selectedPayslipYear);
                                const hasBlock = !!details?.payslipBlockMessage;

                                return (
                                    <View style={tw`p-4 border-t border-white/10 bg-[#2d1266] flex-row justify-between gap-3`}>
                                        <TouchableOpacity
                                            onPress={() => setShowPayslipModal(false)}
                                            style={tw`px-6 py-2.5 bg-slate-800 rounded-xl`}
                                        >
                                            <Text style={tw`text-xs font-bold text-gray-300`}>Back</Text>
                                        </TouchableOpacity>
                                        {!hasBlock && (
                                            <TouchableOpacity
                                                onPress={() => exportPayslipPDF(selectedPayslipMonth, selectedPayslipYear)}
                                                style={tw`px-6 py-2.5 bg-[#8b5cf6] rounded-xl flex-row items-center gap-1.5`}
                                            >
                                                <FileText size={14} color="#fff" />
                                                <Text style={tw`text-xs font-bold text-white`}>Download PDF</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })()}

                        </View>
                    </View>
                </Modal>

            </View>
        </KeyboardAvoidingView>
    );
}
