import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useColorScheme, TextInput, Linking, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { ArrowLeft, User, CreditCard, Briefcase, Calendar, Users, FileText, Trash2, Upload, Eye, X, Check, Info, ChevronDown, Printer, TrendingUp, TrendingDown, Coins } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from '../utils/api';
import tw from 'twrnc';

import { useToast } from '../context/ToastContext';

type ProfileTab = 'personal' | 'documents' | 'statutory' | 'salary' | 'shifts' | 'team';

export default function EmployeeProfileScreen({ route, navigation }: any) {
    const { showToast } = useToast();
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

    // Masters Data
    const [roles, setRoles] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [salaryComponents, setSalaryComponents] = useState<any[]>([]);

    // Edit Profile States
    const [isEditing, setIsEditing] = useState(false);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formDob, setFormDob] = useState('');
    const [formJoiningDate, setFormJoiningDate] = useState('');
    const [formRoleId, setFormRoleId] = useState<string | number>('');
    const [formDesignationId, setFormDesignationId] = useState<string | number>('');
    const [formDepartmentId, setFormDepartmentId] = useState<string | number>('');
    const [formBloodGroup, setFormBloodGroup] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formStatus, setFormStatus] = useState('Active');
    const [formShiftId, setFormShiftId] = useState<string | number>('');

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
    const [selectedSalaryComponents, setSelectedSalaryComponents] = useState<any[]>([]);

    // Picker Modals States
    const [componentPickerType, setComponentPickerType] = useState<'EARNING' | 'DEDUCTION' | null>(null);
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [showDesignationPicker, setShowDesignationPicker] = useState(false);
    const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
    const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

    // Custom Fields mapping
    const [formCustomFields, setFormCustomFields] = useState<Record<number, string>>({});

    // Custom Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'PROFILE_PICTURE' | 'STANDARD_DOC' | 'CUSTOM_FIELD';
        id?: number;
        name: string;
        fieldId?: number;
    } | null>(null);

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
    // ID Card & Profile Picture States
    const [showIDCardModal, setShowIDCardModal] = useState(false);
    const [companySignature, setCompanySignature] = useState<string | null>(null);
    const [profileImgError, setProfileImgError] = useState(false);

    const getHostUrl = () => {
        return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3001';
    };

    const buildProfilePictureUrl = (value?: string | null) => {
        if (!value || typeof value !== 'string') return null;
        if (value.startsWith('bg-')) return null;
        if (/^https?:\/\//i.test(value)) return value;

        const normalizedPath = value.replace(/\\/g, '/').replace(/^\/+/, '');
        const baseUrl = getHostUrl();
        if (normalizedPath.startsWith('uploads/')) {
            return `${baseUrl}/${normalizedPath}`;
        }
        return `${baseUrl}/uploads/${normalizedPath}`;
    };

    const fetchMasterData = async () => {
        try {
            const [rolesRes, desigRes, deptRes, shiftsRes, salCompRes] = await Promise.allSettled([
                api.get('/masters/roles'),
                api.get('/masters/designations'),
                api.get('/masters/departments'),
                api.get('/masters/shifts'),
                api.get('/masters/salary-components'),
            ]);

            if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.data || []);
            if (desigRes.status === 'fulfilled') setDesignations(desigRes.value.data || []);
            if (deptRes.status === 'fulfilled') setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : deptRes.value.data.departments || []);
            if (shiftsRes.status === 'fulfilled') setShifts(shiftsRes.value.data || []);
            if (salCompRes.status === 'fulfilled') setSalaryComponents(salCompRes.value.data || []);
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

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
            showToast('Failed to load employee profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanySignature = async () => {
        try {
            const res = await api.get('/company-setting');
            setCompanySignature(res.data?.authorizedSignature || null);
        } catch (error) {
            console.error('Error fetching company signature:', error);
        }
    };

    const handleUploadProfilePicture = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
            });

            if (res.canceled || !res.assets || res.assets.length === 0) {
                return;
            }

            const asset: any = res.assets[0];
            setLoading(true);

            const formData = new FormData();
            if (Platform.OS === 'web') {
                if (asset.file) {
                    formData.append('profilePicture', asset.file);
                } else if (asset.uri) {
                    const blobRes = await fetch(asset.uri);
                    const blob = await blobRes.blob();
                    formData.append('profilePicture', blob, asset.name || 'profile.jpg');
                }
            } else {
                formData.append('profilePicture', {
                    uri: asset.uri,
                    name: asset.name || 'profile.jpg',
                    type: asset.mimeType || 'image/jpeg',
                } as any);
            }

            const endpoint = id ? `/employee/${id}/profile-picture` : '/employee/me/profile-picture';
            await api.put(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showToast('Profile picture updated successfully!', 'success');
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to upload profile picture:', error);
            showToast(error.response?.data?.message || 'Failed to upload profile picture', 'error');
            setLoading(false);
        }
    };

    const handleDeleteProfilePicture = () => {
        setDeleteTarget({ type: 'PROFILE_PICTURE', name: 'Profile Picture' });
        setShowDeleteModal(true);
    };

    useEffect(() => {
        fetchEmployeeData();
        fetchCompanySignature();
        fetchMasterData();
    }, [id]);

    const startEditing = () => {
        if (!employee) return;
        const prof = employee.employeeProfile || {};
        const stat = prof.statutory || {};
        const bank = prof.bank || {};
        const sal = prof.salary || {};

        setFormName(employee.name || '');
        setFormEmail(employee.email || '');
        setFormPhone(prof.phone || '');
        setFormDob(prof.dob ? new Date(prof.dob).toISOString().split('T')[0] : '');
        setFormJoiningDate(prof.joiningDate ? new Date(prof.joiningDate).toISOString().split('T')[0] : '');
        setFormRoleId(employee.roleId || employee.role?.id || '');
        setFormDesignationId(prof.designationId || '');
        setFormDepartmentId(prof.departmentId || '');
        setFormBloodGroup(prof.bloodGroup || '');
        setFormAddress(prof.address || '');
        setFormStatus(prof.status || 'Active');

        setFormPan(stat.panNumber || stat.pan || '');
        setFormAadhaar(stat.aadhaarNumber || stat.aadhaar || '');
        setFormUan(stat.uanNumber || stat.uan || '');
        setFormEsic(stat.esicNumber || stat.esic || '');

        setFormBankName(bank.bankName || '');
        setFormAccountNumber(bank.accountNumber || '');
        setFormIfscCode(bank.ifscCode || bank.ifsc || '');

        setFormShiftId(prof.shiftId || '');

        setFormBasicSalary(sal.basic ? sal.basic.toString() : '0');

        const selComp = prof.selectedSalaryComponents || prof.salaryComponents || [];
        setSelectedSalaryComponents(Array.isArray(selComp) ? selComp : []);

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

            const selectedRoleObj = roles.find((r: any) => String(r.id) === String(formRoleId));
            const selectedDesigObj = designations.find((d: any) => String(d.id) === String(formDesignationId));
            const selectedDeptObj = departments.find((d: any) => String(d.id) === String(formDepartmentId));

            // Build profileData structure matching backend expectations
            const profileData = {
                name: formName.trim(),
                email: formEmail.trim(),
                phone: formPhone.trim(),
                dob: formDob ? new Date(formDob).toISOString() : null,
                joiningDate: formJoiningDate ? new Date(formJoiningDate).toISOString() : null,
                bloodGroup: formBloodGroup.trim(),
                address: formAddress.trim(),
                status: formStatus || 'Active',
                roleId: formRoleId ? Number(formRoleId) : undefined,
                role: selectedRoleObj?.name || selectedRoleObj?.title || (typeof employee.role === 'string' ? employee.role : employee.role?.name),
                designationId: formDesignationId ? Number(formDesignationId) : undefined,
                title: selectedDesigObj?.name || employee?.employeeProfile?.title,
                departmentId: formDepartmentId ? Number(formDepartmentId) : undefined,
                department: selectedDeptObj?.name || employee?.employeeProfile?.department,
                shiftId: formShiftId ? Number(formShiftId) : undefined,

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
                salary: formBasicSalary ? { basic: Number(formBasicSalary) } : undefined,
                selectedSalaryComponents: selectedSalaryComponents,
                salaryComponents: selectedSalaryComponents
            };

            await api.put(endpoint, profileData);

            // Save custom fields
            const customFieldsPayload = Object.keys(formCustomFields).reduce((acc: any, key) => {
                const val = (formCustomFields as Record<string | number, string>)[key] ?? (formCustomFields as Record<string | number, string>)[Number(key)];
                if (val !== undefined) {
                    acc[key] = val;
                }
                return acc;
            }, {});
            const customFieldsEndpoint = id ? `/custom-fields/employee/${id}` : '/custom-fields/employee/me';
            await api.put(customFieldsEndpoint, { customFields: customFieldsPayload });

            showToast('Profile updated successfully!', 'success');
            setIsEditing(false);
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            showToast(error.response?.data?.message || 'Failed to save profile changes', 'error');
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

            const asset: any = res.assets[0];
            const employeeId = id || 'me';

            setLoading(true);

            const formData = new FormData();
            if (Platform.OS === 'web') {
                if (asset.file) {
                    formData.append('file', asset.file);
                } else if (asset.uri) {
                    const blobRes = await fetch(asset.uri);
                    const blob = await blobRes.blob();
                    formData.append('file', blob, asset.name || 'document.pdf');
                }
            } else {
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.name || 'document.pdf',
                    type: asset.mimeType || 'application/pdf',
                } as any);
            }

            await api.post(`/custom-fields/employee/${employeeId}/field/${fieldId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showToast('Document uploaded successfully!', 'success');
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to upload document:', error);
            showToast(error.response?.data?.message || 'Failed to upload document', 'error');
            setLoading(false);
        }
    };

    const handleUploadStandardDocument = async (docName: string, docKey: string) => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (res.canceled || !res.assets || res.assets.length === 0) return;

            const asset: any = res.assets[0];
            const employeeId = id || employee?.id || 'me';

            setLoading(true);
            const formData = new FormData();
            if (Platform.OS === 'web') {
                if (asset.file) {
                    formData.append('file', asset.file);
                } else if (asset.uri) {
                    const blobRes = await fetch(asset.uri);
                    const blob = await blobRes.blob();
                    formData.append('file', blob, asset.name || `${docKey}.pdf`);
                }
            } else {
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.name || `${docKey}.pdf`,
                    type: asset.mimeType || 'application/pdf',
                } as any);
            }
            formData.append('name', docName);

            await api.post(`/employee/${employeeId}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showToast(`${docName} uploaded successfully!`, 'success');
            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to upload document:', error);
            showToast(error.response?.data?.message || `Failed to upload ${docName}`, 'error');
            setLoading(false);
        }
    };

    const handleDeleteStandardDocument = (docId: number, docName: string) => {
        setDeleteTarget({ type: 'STANDARD_DOC', id: docId, name: docName });
        setShowDeleteModal(true);
    };

    const handleDeleteDocument = (fieldId: number, fieldName: string) => {
        setDeleteTarget({ type: 'CUSTOM_FIELD', fieldId, name: fieldName });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setShowDeleteModal(false);
            setLoading(true);
            const employeeId = id || employee?.id || 'me';

            if (deleteTarget.type === 'PROFILE_PICTURE') {
                const endpoint = id ? `/employee/${id}/profile-picture` : '/employee/me/profile-picture';
                await api.delete(endpoint);
                showToast('Profile picture deleted successfully!', 'success');
            } else if (deleteTarget.type === 'STANDARD_DOC' && deleteTarget.id) {
                await api.delete(`/employee/${employeeId}/documents/${deleteTarget.id}`);
                showToast(`${deleteTarget.name} deleted successfully!`, 'success');
            } else if (deleteTarget.type === 'CUSTOM_FIELD' && deleteTarget.fieldId !== undefined) {
                await api.delete(`/custom-fields/employee/${employeeId}/field/${deleteTarget.fieldId}/document`);
                showToast(`${deleteTarget.name} deleted successfully!`, 'success');
            }

            fetchEmployeeData();
        } catch (error: any) {
            console.error('Failed to delete:', error);
            showToast(error.response?.data?.message || `Failed to delete ${deleteTarget?.name || 'item'}`, 'error');
            setLoading(false);
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleViewDocument = async (documentUrl: string) => {
        try {
            if (!documentUrl) {
                showToast('Document URL is missing', 'error');
                return;
            }

            // Normalize Windows backslashes to forward slashes and trim whitespace
            let cleanPath = String(documentUrl).replace(/\\/g, '/').trim();

            if (!cleanPath.startsWith('http://') && !cleanPath.startsWith('https://')) {
                // Strip leading slashes
                cleanPath = cleanPath.replace(/^\/+/, '');

                // Ensure path includes uploads/ prefix if relative
                if (!cleanPath.startsWith('uploads/')) {
                    cleanPath = `uploads/${cleanPath}`;
                }

                const hostUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : 'http://localhost:3001';
                cleanPath = `${hostUrl}/${cleanPath}`;
            }

            const encodedUrl = encodeURI(cleanPath);

            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.open(encodedUrl, '_blank');
            } else {
                const canOpen = await Linking.canOpenURL(encodedUrl);
                if (canOpen) {
                    await Linking.openURL(encodedUrl);
                } else {
                    await Sharing.shareAsync(encodedUrl);
                }
            }
        } catch (error) {
            console.error('Failed to open document URL:', error);
            showToast('Failed to open document', 'error');
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
            showToast(details.payslipBlockMessage, 'error');
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
            showToast(error.message || "Failed to generate Payslip", 'error');
        }
    };

    const exportIDCardPDF = async () => {
        if (!employee) return;
        const prof = employee.employeeProfile || {};
        const qrData = encodeURIComponent(`Employee ID: ${employee.id}\nName: ${employee.name}\nRole: ${prof.title || 'Employee'}\nDept: ${prof.department || 'N/A'}`);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        margin: 0;
                        padding: 40px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #000000;
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    }
                    .id-card {
                        width: 320px;
                        height: 540px;
                        background: white;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 0 40px rgba(0,0,0,0.5);
                        position: relative;
                        box-sizing: border-box;
                    }
                    .card-header {
                        background: linear-gradient(135deg, #5b21b6, #7c3aed);
                        height: 190px;
                        padding: 16px 24px;
                        color: white;
                        position: relative;
                        border-bottom-left-radius: 40px;
                        border-bottom-right-radius: 40px;
                        box-sizing: border-box;
                    }
                    .top-pill {
                        width: 60px;
                        height: 8px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 4px;
                        margin: 0 auto 12px;
                    }
                    .brand-title {
                        font-size: 18px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    .brand-sub {
                        color: #c4b5fd;
                    }
                    .chip {
                        position: absolute;
                        top: 24px;
                        right: 24px;
                        width: 40px;
                        height: 30px;
                        background: linear-gradient(135deg, #fef08a, #eab308);
                        border-radius: 6px;
                        border: 1px solid rgba(253,224,71,0.5);
                    }
                    .avatar-container {
                        text-align: center;
                        margin-top: -60px;
                        position: relative;
                        z-index: 10;
                    }
                    .avatar-img {
                        width: 120px;
                        height: 120px;
                        border-radius: 60px;
                        border: 4px solid white;
                        object-fit: cover;
                        background: #7c3aed;
                        color: white;
                        font-size: 36px;
                        font-weight: bold;
                        line-height: 120px;
                        margin: 0 auto;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .name {
                        font-size: 22px;
                        font-weight: bold;
                        color: #1f2937;
                        margin-top: 12px;
                        text-align: center;
                    }
                    .title {
                        font-size: 14px;
                        font-weight: 500;
                        color: #7c3aed;
                        margin-top: 4px;
                        text-align: center;
                    }
                    .divider {
                        width: 48px;
                        height: 4px;
                        background: #ddd6fe;
                        border-radius: 2px;
                        margin: 12px auto;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px 16px;
                        padding: 0 24px;
                        text-align: left;
                    }
                    .label {
                        font-size: 9px;
                        color: #9ca3af;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .val {
                        font-size: 13px;
                        color: #374151;
                        font-weight: 600;
                    }
                    .card-footer {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 16px 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: white;
                        box-sizing: border-box;
                    }
                    .qr-img {
                        width: 60px;
                        height: 60px;
                    }
                    .sig-box {
                        text-align: right;
                    }
                    .sig-img {
                        max-width: 100px;
                        max-height: 35px;
                        display: block;
                        margin-left: auto;
                    }
                    .sig-text {
                        font-size: 11px;
                        font-style: italic;
                        color: #9ca3af;
                    }
                </style>
            </head>
            <body>
                <div class="id-card">
                    <div class="card-header">
                        <div class="top-pill"></div>
                        <div class="brand-title">EnCalm <span class="brand-sub">HRX</span></div>
                        <div class="chip"></div>
                    </div>
                    <div class="avatar-container">
                        ${profilePictureUrl ? `<img class="avatar-img" src="${profilePictureUrl}" />` : `<div class="avatar-img">${initials}</div>`}
                    </div>
                    <div class="name">${employee.name}</div>
                    <div class="title">${prof.title || 'Employee'}</div>
                    <div class="divider"></div>
                    <div class="details-grid">
                        <div>
                            <div class="label">Employee ID</div>
                            <div class="val">${employee.id}</div>
                        </div>
                        <div>
                            <div class="label">Blood Group</div>
                            <div class="val">${prof.bloodGroup || 'N/A'}</div>
                        </div>
                        <div>
                            <div class="label">Department</div>
                            <div class="val">${prof.department || 'N/A'}</div>
                        </div>
                        <div>
                            <div class="label">Mobile Number</div>
                            <div class="val">${prof.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <img class="qr-img" src="${qrUrl}" />
                        <div class="sig-box">
                            ${adminSignatureUrl ? `<img class="sig-img" src="${adminSignatureUrl}" />` : ''}
                            <div class="sig-text">Authorized Sig.</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        } catch (error: any) {
            showToast(error.message || "Failed to export ID Card", 'error');
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

    const profile = employee?.employeeProfile || {};
    const rawProfilePicture =
        profile.avatar ||
        profile.profilePicture ||
        profile.profilePictureUrl ||
        employee?.avatar ||
        employee?.profilePicture ||
        employee?.profilePictureUrl ||
        null;
    const profilePictureUrl = buildProfilePictureUrl(rawProfilePicture);
    const initials = typeof employee?.name === 'string' && employee.name.trim()
        ? employee.name.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'EP';

    const safeToISODate = (val: any): string => {
        if (!val) return '';
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const safeLocaleDate = (val: any, options?: Intl.DateTimeFormatOptions): string => {
        if (!val) return 'N/A';
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString('en-IN', options);
        } catch {
            return 'N/A';
        }
    };

    const adminSignatureUrl = companySignature
        ? companySignature.startsWith('http')
            ? companySignature
            : `${getHostUrl()}${companySignature.startsWith('/') ? companySignature : `/uploads/${companySignature}`}`
        : null;

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
                    <View style={tw`w-10`} /> 
                </View>

                <ScrollView style={tw`flex-grow`} showsVerticalScrollIndicator={false}>

                    {/* Profile Banner */}
                    <View style={tw`items-center py-6 bg-white dark:bg-[#4c1d95] border-b border-gray-100 dark:border-white/5 mb-4`}>
                        <View style={tw`w-20 h-20 rounded-3xl bg-[#ede9fe] dark:bg-[#8b5cf6] flex items-center justify-center mb-3 shadow-md shadow-[#8b5cf6]/20 overflow-hidden`}>
                            {profilePictureUrl && !profileImgError ? (
                                <Image
                                    source={{ uri: profilePictureUrl }}
                                    style={tw`w-full h-full`}
                                    resizeMode="cover"
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                <Text style={tw`text-[#8b5cf6] dark:text-white font-extrabold text-2xl`}>{initials}</Text>
                            )}
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

                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200 mt-1`}>
                            {(employee.role && typeof employee.role === 'object' ? employee.role.name : employee.role) || 'HR_ADMIN'} - {profile.title || 'hr'}
                        </Text>

                        {/* Badges matching web */}
                        <View style={tw`flex-row gap-2 mt-3`}>
                            <View style={tw`px-2.5 py-0.5 bg-gray-50 dark:bg-white/10 rounded-full border border-gray-100 dark:border-white/5`}>
                                <Text style={tw`text-[10px] font-bold text-gray-500 dark:text-purple-200`}>ID: {employee.id}</Text>
                            </View>
                            <View style={tw`px-2.5 py-0.5 bg-gray-50 dark:bg-white/10 rounded-full border border-gray-100 dark:border-white/5`}>
                                <Text style={tw`text-[10px] font-bold text-gray-500 dark:text-purple-200`}>{profile.department || 'Head Office'}</Text>
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
                                    <Text style={tw`text-xs font-bold ${activeTab === tab.key ? 'text-white' : 'text-gray-500 dark:text-gray-200'}`}>
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

                                {isEditing ? (
                                    <View>
                                        {renderEditableDetailRow('Phone', profile.phone, formPhone, setFormPhone, 'e.g. 1119299291', 'number-pad')}
                                        {renderEditableDetailRow('Email', employee.email, formEmail, setFormEmail, 'Enter email address', 'email-address')}
                                        {renderEditableDetailRow('Date of Birth (YYYY-MM-DD)', safeToISODate(profile.dob), formDob, setFormDob, 'YYYY-MM-DD')}
                                        {renderEditableDetailRow('Date of Joining (YYYY-MM-DD)', safeToISODate(profile.joiningDate), formJoiningDate, setFormJoiningDate, 'YYYY-MM-DD')}

                                        {/* System Role Selector */}
                                        <TouchableOpacity
                                            onPress={() => setShowRolePicker(true)}
                                            style={tw`py-3 border-b border-gray-50 dark:border-slate-700/20`}
                                        >
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>System Role</Text>
                                            <View style={tw`flex-row justify-between items-center bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5`}>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                    {roles.find(r => String(r.id) === String(formRoleId))?.name || (typeof employee.role === 'object' ? employee.role?.name : employee.role) || 'Select Role'}
                                                </Text>
                                                <ChevronDown size={16} color="#94a3b8" />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Designation Selector */}
                                        <TouchableOpacity
                                            onPress={() => setShowDesignationPicker(true)}
                                            style={tw`py-3 border-b border-gray-50 dark:border-slate-700/20`}
                                        >
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>Designation</Text>
                                            <View style={tw`flex-row justify-between items-center bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5`}>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                    {designations.find(d => String(d.id) === String(formDesignationId))?.name || profile.title || 'Select Designation'}
                                                </Text>
                                                <ChevronDown size={16} color="#94a3b8" />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Department Selector */}
                                        <TouchableOpacity
                                            onPress={() => setShowDepartmentPicker(true)}
                                            style={tw`py-3 border-b border-gray-50 dark:border-slate-700/20`}
                                        >
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>Department</Text>
                                            <View style={tw`flex-row justify-between items-center bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5`}>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                    {departments.find(d => String(d.id) === String(formDepartmentId))?.name || profile.department || 'Select Department'}
                                                </Text>
                                                <ChevronDown size={16} color="#94a3b8" />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Blood Group Selector */}
                                        <TouchableOpacity
                                            onPress={() => setShowBloodGroupPicker(true)}
                                            style={tw`py-3 border-b border-gray-50 dark:border-slate-700/20`}
                                        >
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>Blood Group</Text>
                                            <View style={tw`flex-row justify-between items-center bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5`}>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                    {formBloodGroup || 'Select Blood Group'}
                                                </Text>
                                                <ChevronDown size={16} color="#94a3b8" />
                                            </View>
                                        </TouchableOpacity>

                                        {renderEditableDetailRow('Address', profile.address, formAddress, setFormAddress, 'Enter home address')}

                                        {/* Employment Status Options */}
                                        <View style={tw`py-3 border-b border-gray-50 dark:border-slate-700/20`}>
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-2`}>Employment Status</Text>
                                            <View style={tw`flex-row gap-2`}>
                                                {['Active', 'Inactive', 'OnNotice'].map((st) => (
                                                    <TouchableOpacity
                                                        key={st}
                                                        onPress={() => setFormStatus(st)}
                                                        style={tw`px-3.5 py-1.5 rounded-full ${formStatus === st ? 'bg-[#8b5cf6]' : 'bg-gray-100 dark:bg-white/5'}`}
                                                    >
                                                        <Text style={tw`text-xs font-bold ${formStatus === st ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {st}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View>
                                        {renderDetailRow('Phone', profile.phone)}
                                        {renderDetailRow('Email', employee.email)}
                                        {renderDetailRow('Date of Birth', safeLocaleDate(profile.dob))}
                                        {renderDetailRow('Date of Joining', safeLocaleDate(profile.joiningDate))}
                                        {renderDetailRow('System Role', employee.role && typeof employee.role === 'object' ? employee.role.name : employee.role)}
                                        {renderDetailRow('Designation', profile.title)}
                                        {renderDetailRow('Department', profile.department)}
                                        {renderDetailRow('Blood Group', profile.bloodGroup)}
                                        {renderDetailRow('Address', profile.address)}

                                        {/* Status Row */}
                                        <View style={tw`flex-row justify-between py-3 border-b border-gray-50 dark:border-slate-700/20 items-center`}>
                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase`}>Status</Text>
                                            <View style={tw`px-2.5 py-0.5 bg-green-100 dark:bg-green-950/40 rounded-full`}>
                                                <Text style={tw`text-[9px] font-bold text-green-700 dark:text-green-400 uppercase`}>
                                                    {employee.status || 'ACTIVE'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Additional Custom Personal Details */}
                                {personalFields.length > 0 && (
                                    <View style={tw`mt-6 pt-4 border-t border-gray-100 dark:border-white/5`}>
                                        <Text style={tw`text-xs font-black text-gray-400 dark:text-purple-300 uppercase tracking-widest mb-3`}>Additional Details</Text>
                                        {personalFields.map(ca => {
                                            const fType = (ca.field?.type || 'TEXT').toUpperCase();
                                            const fieldVal = (formCustomFields as Record<string | number, string>)[ca.fieldId] ?? (formCustomFields as Record<string | number, string>)[String(ca.fieldId)] ?? ca.value ?? '';

                                            if (isEditing) {
                                                // 1. Radio Buttons (e.g. SEX with options 'Mail, female')
                                                if (fType === 'RADIO' || fType === 'RADIO_BUTTON') {
                                                    const rawOpts = ca.field?.options || 'Yes, No';
                                                    const cleanOpts = rawOpts.replace(/^Radio\s*button\s*\(/i, '').replace(/\)$/, '');
                                                    const options = cleanOpts.split(',').map((o: string) => o.trim()).filter(Boolean);

                                                    return (
                                                        <View key={ca.id} style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-2`}>{ca.field.name}</Text>
                                                            <View style={tw`flex-row flex-wrap gap-4 py-1`}>
                                                                {options.map((opt: string) => {
                                                                    const isSelected = fieldVal === opt;
                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={opt}
                                                                            onPress={() => {
                                                                                setFormCustomFields(prev => ({
                                                                                    ...prev,
                                                                                    [ca.fieldId]: opt,
                                                                                    [String(ca.fieldId)]: opt
                                                                                }));
                                                                            }}
                                                                            style={tw`flex-row items-center gap-2`}
                                                                        >
                                                                            <View style={tw`w-4 h-4 rounded-full border-2 ${isSelected ? 'border-[#8b5cf6] items-center justify-center' : 'border-gray-400 dark:border-white/30'}`}>
                                                                                {isSelected && <View style={tw`w-2.5 h-2.5 rounded-full bg-[#8b5cf6]`} />}
                                                                            </View>
                                                                            <Text style={tw`text-xs font-bold ${isSelected ? 'text-[#8b5cf6] dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                                {opt}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>
                                                    );
                                                }

                                                // 2. File / PDF / Image Custom Attachment
                                                if (['FILE', 'PDF', 'IMAGE', 'FILE_UPLOAD', 'PDF_DOCUMENT'].includes(fType)) {
                                                    const hasFile = Boolean(ca.documentUrl);
                                                    return (
                                                        <View key={ca.id} style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                                                            <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>{ca.field.name}</Text>
                                                            <View style={tw`flex-row items-center justify-between bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2`}>
                                                                <Text style={tw`text-xs text-gray-500 dark:text-gray-400 flex-1 mr-2`} numberOfLines={1}>
                                                                    {hasFile ? (ca.documentName || 'Document uploaded') : 'No file uploaded'}
                                                                </Text>
                                                                <View style={tw`flex-row items-center gap-2`}>
                                                                    {!hasFile ? (
                                                                        <TouchableOpacity
                                                                            onPress={() => handleUploadDocument(ca.fieldId)}
                                                                            style={tw`flex-row items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] rounded-xl`}
                                                                        >
                                                                            <Upload size={12} color="#fff" />
                                                                            <Text style={tw`text-xs font-bold text-white`}>Upload</Text>
                                                                        </TouchableOpacity>
                                                                    ) : (
                                                                        <>
                                                                            <TouchableOpacity
                                                                                onPress={() => handleViewDocument(ca.documentUrl!)}
                                                                                style={tw`w-8 h-8 rounded-lg flex items-center justify-center bg-[#8b5cf6]/10`}
                                                                            >
                                                                                <Eye size={16} color="#8b5cf6" />
                                                                            </TouchableOpacity>
                                                                            <TouchableOpacity
                                                                                onPress={() => handleDeleteDocument(ca.fieldId, ca.field.name)}
                                                                                style={tw`w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10`}
                                                                            >
                                                                                <Trash2 size={16} color="#ef4444" />
                                                                            </TouchableOpacity>
                                                                        </>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    );
                                                }

                                                // 3. Text, Password, Email, Number
                                                const isPassword = fType === 'PASSWORD';
                                                const kbType = fType === 'NUMBER' ? 'number-pad' : fType === 'EMAIL' ? 'email-address' : 'default';

                                                return (
                                                    <View key={ca.id} style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                                                        <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>{ca.field.name}</Text>
                                                        <TextInput
                                                            style={tw`w-full px-3 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-9`}
                                                            value={fieldVal}
                                                            onChangeText={(text) => {
                                                                setFormCustomFields(prev => ({
                                                                    ...prev,
                                                                    [ca.fieldId]: text,
                                                                    [String(ca.fieldId)]: text
                                                                }));
                                                            }}
                                                            placeholder={`Enter ${ca.field.name}`}
                                                            placeholderTextColor="#94a3b8"
                                                            secureTextEntry={isPassword}
                                                            keyboardType={kbType}
                                                        />
                                                    </View>
                                                );
                                            }

                                            // View Mode
                                            if (fType === 'PASSWORD') {
                                                return renderDetailRow(ca.field?.name || 'Custom Field', ca.value ? '••••••••' : 'N/A');
                                            }
                                            return renderDetailRow(ca.field?.name || 'Custom Field', ca.value || 'N/A');
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'documents' && (() => {
                            const REQUIRED_DOCUMENTS = [
                                { key: 'aadhaar', name: 'Aadhaar Card' },
                                { key: 'pan', name: 'PAN Card' },
                                { key: 'degree', name: 'Highest Qualification Degree' },
                            ];
                            const documentsList = employee?.employeeProfile?.documents || employee?.documents || [];

                            return (
                                <View>
                                    <View style={tw`flex-row items-center gap-2 mb-4`}>
                                        <FileText size={18} color="#8b5cf6" />
                                        <Text style={tw`text-sm font-bold text-gray-900 dark:text-white`}>Document Vault</Text>
                                    </View>

                                    {/* Standard Mandatory Documents (Aadhaar Card, PAN Card, Degree) */}
                                    {REQUIRED_DOCUMENTS.map((doc) => {
                                        const savedDoc = documentsList.find((d: any) => d.name === doc.name);
                                        return (
                                            <View key={doc.name} style={tw`bg-white/10 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 mb-3 flex-row items-center justify-between`}>
                                                <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
                                                    <View style={tw`p-2.5 bg-[#8b5cf6]/10 rounded-xl`}>
                                                        <FileText size={18} color="#8b5cf6" />
                                                    </View>
                                                    <View style={tw`flex-1`}>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                            {doc.name} <Text style={tw`text-red-500`}>*</Text>
                                                        </Text>
                                                        {savedDoc ? (
                                                            <Text style={tw`text-[10px] text-green-600 dark:text-green-400 mt-1`} numberOfLines={1}>
                                                                {savedDoc.originalName || savedDoc.url || 'Document Uploaded'}
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
                                                    {isEditing && !savedDoc && (
                                                        <TouchableOpacity
                                                            onPress={() => handleUploadStandardDocument(doc.name, doc.key)}
                                                            style={tw`flex-row items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] rounded-xl mr-1`}
                                                        >
                                                            <Upload size={12} color="#fff" />
                                                            <Text style={tw`text-xs font-bold text-white`}>Upload</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* View button */}
                                                    {savedDoc && Boolean(savedDoc.url) && (
                                                        <TouchableOpacity
                                                            onPress={() => handleViewDocument(savedDoc.url)}
                                                            style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-[#8b5cf6]/10 dark:bg-white/10`}
                                                        >
                                                            <Eye size={18} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* Delete Button in Edit Mode if file exists */}
                                                    {isEditing && savedDoc && (
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteStandardDocument(savedDoc.id, doc.name)}
                                                            style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10`}
                                                        >
                                                            <Trash2 size={18} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}

                                    {/* Dedicated Profile Picture Slot */}
                                    <View style={tw`bg-white/10 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 mb-3 flex-row items-center justify-between`}>
                                        <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
                                            <View style={tw`w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center overflow-hidden`}>
                                                {profilePictureUrl && !profileImgError ? (
                                                    <Image
                                                        source={{ uri: profilePictureUrl }}
                                                        style={tw`w-full h-full`}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <User size={18} color="#8b5cf6" />
                                                )}
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                    Profile Picture <Text style={tw`text-red-500`}>*</Text>
                                                </Text>
                                                {profilePictureUrl ? (
                                                    <Text style={tw`text-[10px] text-green-600 dark:text-green-400 mt-1`} numberOfLines={1}>
                                                        Profile picture uploaded
                                                    </Text>
                                                ) : (
                                                    <Text style={tw`text-[10px] text-gray-400 dark:text-purple-300 mt-1`}>
                                                        No profile picture uploaded
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        <View style={tw`flex-row items-center gap-2`}>
                                            {/* Upload/Change Button in Edit Mode */}
                                            {isEditing && (
                                                <TouchableOpacity
                                                    onPress={handleUploadProfilePicture}
                                                    style={tw`flex-row items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] rounded-xl mr-1`}
                                                >
                                                    <Upload size={12} color="#fff" />
                                                    <Text style={tw`text-xs font-bold text-white`}>
                                                        {profilePictureUrl ? 'Change' : 'Upload'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            {/* View Profile Picture Button */}
                                            {Boolean(profilePictureUrl) && (
                                                <TouchableOpacity
                                                    onPress={() => handleViewDocument(profilePictureUrl!)}
                                                    style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-[#8b5cf6]/10 dark:bg-white/10`}
                                                >
                                                    <Eye size={18} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                                                </TouchableOpacity>
                                            )}

                                            {/* Delete Profile Picture Button in Edit Mode */}
                                            {isEditing && Boolean(profilePictureUrl) && (
                                                <TouchableOpacity
                                                    onPress={handleDeleteProfilePicture}
                                                    style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10`}
                                                >
                                                    <Trash2 size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    {/* Dynamic Custom Fields Documents */}
                                    {documentFields.map(ca => {
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
                                                            <Text style={tw`text-[10px] text-green-600 dark:text-green-400 mt-1`} numberOfLines={1}>
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

                                                    {/* Eye view button */}
                                                    {Boolean(ca.documentUrl) && (
                                                        <TouchableOpacity
                                                            onPress={() => handleViewDocument(ca.documentUrl)}
                                                            style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-[#8b5cf6]/10 dark:bg-white/10`}
                                                        >
                                                            <Eye size={18} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* Delete Button in Edit Mode if file exists */}
                                                    {isEditing && Boolean(ca.documentUrl) && (
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
                                    })}
                                </View>
                            );
                        })()}

                        {activeTab === 'statutory' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Statutory Details</Text>
                                {isEditing ? (
                                    <View>
                                        {renderEditableDetailRow('UAN (Provident Fund)', profile.statutory?.uan || profile.statutory?.uanNumber, formUan, setFormUan, '12-digit UAN', 'number-pad')}
                                        {renderEditableDetailRow('ESIC Number', profile.statutory?.esic || profile.statutory?.esicNumber, formEsic, setFormEsic, '10-digit ESIC Number', 'number-pad')}
                                        {renderEditableDetailRow('PAN Number', profile.statutory?.pan || profile.statutory?.panNumber, formPan, setFormPan, 'e.g. ABCDE1234F')}
                                        {renderEditableDetailRow('Aadhaar Number', profile.statutory?.aadhaar || profile.statutory?.aadhaarNumber, formAadhaar, setFormAadhaar, '12-digit Aadhaar', 'number-pad')}

                                        <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mt-6 mb-4`}>Bank Account</Text>
                                        {renderEditableDetailRow('Bank Name', profile.bank?.bankName, formBankName, setFormBankName, 'e.g. HDFC Bank')}
                                        {renderEditableDetailRow('Account Number', profile.bank?.accountNumber, formAccountNumber, setFormAccountNumber, '9 to 18 digits', 'number-pad')}
                                        {renderEditableDetailRow('IFSC Code', profile.bank?.ifsc || profile.bank?.ifscCode, formIfscCode, setFormIfscCode, 'e.g. SBIN0123456')}
                                    </View>
                                ) : (
                                    <View>
                                        {renderDetailRow('PAN Card', profile.statutory?.pan || profile.statutory?.panNumber)}
                                        {renderDetailRow('Aadhaar Number', profile.statutory?.aadhaar || profile.statutory?.aadhaarNumber)}
                                        {renderDetailRow('UAN (PF)', profile.statutory?.uan || profile.statutory?.uanNumber)}
                                        {renderDetailRow('ESIC Number', profile.statutory?.esic || profile.statutory?.esicNumber)}
                                        {renderDetailRow('Bank Name', profile.bank?.bankName)}
                                        {renderDetailRow('IFSC Code', profile.bank?.ifsc || profile.bank?.ifscCode)}
                                        {renderDetailRow('Account Number', profile.bank?.accountNumber)}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'salary' && (() => {
                            const getComponentAmount = (comp: any) => {
                                const basic = Number(isEditing ? formBasicSalary : (profile?.salary?.basic || 0));
                                if (comp.calculationType === 'FLAT') {
                                    return Number(comp.value || 0);
                                }
                                return (basic * Number(comp.value || 0)) / 100;
                            };

                            const rawActiveComp = isEditing
                                ? selectedSalaryComponents
                                : (profile?.selectedSalaryComponents || profile?.salaryComponents || []);
                            const activeSalaryComponents = Array.isArray(rawActiveComp) ? rawActiveComp : [];

                            const earningsComponents = activeSalaryComponents.filter((c: any) => c?.type === 'EARNING');
                            const deductionComponents = activeSalaryComponents.filter((c: any) => c?.type === 'DEDUCTION');

                            const currentBasicAmount = Number(isEditing ? formBasicSalary : (profile?.salary?.basic || 0));
                            const salaryOverviewEarnings = currentBasicAmount + earningsComponents.reduce((acc: number, c: any) => acc + getComponentAmount(c), 0);
                            const salaryOverviewDeductions = deductionComponents.reduce((acc: number, c: any) => acc + getComponentAmount(c), 0);
                            const salaryOverviewNet = salaryOverviewEarnings - salaryOverviewDeductions;

                            return (
                                <View>
                                    <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Salary Overview</Text>

                                    {/* Salary Overview 3 Cards */}
                                    <View style={tw`flex-row flex-wrap justify-between gap-2 mb-6`}>
                                        {/* Total Earnings */}
                                        <View style={tw`w-[31%] p-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 relative overflow-hidden`}>
                                            <View style={tw`w-7 h-7 rounded-lg bg-green-500/20 items-center justify-center mb-2`}>
                                                <TrendingUp size={16} color="#22c55e" />
                                            </View>
                                            <Text style={tw`text-[10px] font-bold text-green-600 dark:text-green-400`}>Total Earnings</Text>
                                            <Text style={tw`text-sm font-black text-gray-900 dark:text-white mt-1`} numberOfLines={1}>
                                                ₹ {salaryOverviewEarnings.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={tw`text-[9px] text-gray-400 mt-0.5`}>Per Month</Text>
                                        </View>

                                        {/* Total Deductions */}
                                        <View style={tw`w-[31%] p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 relative overflow-hidden`}>
                                            <View style={tw`w-7 h-7 rounded-lg bg-red-500/20 items-center justify-center mb-2`}>
                                                <TrendingDown size={16} color="#ef4444" />
                                            </View>
                                            <Text style={tw`text-[10px] font-bold text-red-500 dark:text-red-400`}>Total Deductions</Text>
                                            <Text style={tw`text-sm font-black text-gray-900 dark:text-white mt-1`} numberOfLines={1}>
                                                ₹ {salaryOverviewDeductions.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={tw`text-[9px] text-gray-400 mt-0.5`}>Per Month</Text>
                                        </View>

                                        {/* Net Salary */}
                                        <View style={tw`w-[31%] p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 relative overflow-hidden`}>
                                            <View style={tw`w-7 h-7 rounded-lg bg-blue-500/20 items-center justify-center mb-2`}>
                                                <Coins size={16} color="#3b82f6" />
                                            </View>
                                            <Text style={tw`text-[10px] font-bold text-blue-600 dark:text-blue-400`}>Net Salary</Text>
                                            <Text style={tw`text-sm font-black text-gray-900 dark:text-white mt-1`} numberOfLines={1}>
                                                ₹ {salaryOverviewNet.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={tw`text-[9px] text-gray-400 mt-0.5`}>Per Month</Text>
                                        </View>
                                    </View>

                                    {/* Earnings & Deductions Containers */}
                                    <View style={tw`gap-5`}>
                                        {/* Earnings Container */}
                                        <View style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5`}>
                                            <Text style={tw`text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-3`}>Earnings</Text>

                                            {/* Basic Salary Row */}
                                            <View style={tw`flex-row justify-between items-center py-2.5 border-b border-gray-200 dark:border-white/10`}>
                                                <View>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>Basic Salary</Text>
                                                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>Fixed Base Pay</Text>
                                                </View>
                                                {isEditing ? (
                                                    <TextInput
                                                        style={tw`px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold w-32 text-right`}
                                                        value={formBasicSalary}
                                                        onChangeText={setFormBasicSalary}
                                                        keyboardType="number-pad"
                                                        placeholder="Enter Basic"
                                                        placeholderTextColor="#94a3b8"
                                                    />
                                                ) : (
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                        ₹ {Number(profile.salary?.basic || 0).toLocaleString('en-IN')}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Earning Components List */}
                                            {earningsComponents.map((comp: any) => (
                                                <View key={comp.id} style={tw`flex-row justify-between items-center py-2.5 border-b border-gray-200 dark:border-white/10`}>
                                                    <View>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{comp.name}</Text>
                                                        <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                            {comp.calculationType === 'FLAT' ? 'Fixed' : `${comp.value}% of Basic`}
                                                        </Text>
                                                    </View>
                                                    <View style={tw`flex-row items-center gap-3`}>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                            ₹ {getComponentAmount(comp).toLocaleString('en-IN')}
                                                        </Text>
                                                        {isEditing && (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setSelectedSalaryComponents(prev => prev.filter(c => String(c.id) !== String(comp.id)));
                                                                }}
                                                                style={tw`p-1.5 bg-red-500/10 rounded-lg`}
                                                            >
                                                                <Trash2 size={14} color="#ef4444" />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}

                                            {/* Add Earnings Component Button */}
                                            {isEditing && (
                                                <TouchableOpacity
                                                    onPress={() => setComponentPickerType('EARNING')}
                                                    style={tw`mt-3 py-2.5 rounded-xl border border-dashed border-green-500/40 items-center justify-center bg-green-500/5`}
                                                >
                                                    <Text style={tw`text-xs font-bold text-green-600 dark:text-green-400`}>+ Add Earnings Component</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Deductions Container */}
                                        <View style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5`}>
                                            <Text style={tw`text-xs font-black text-red-500 dark:text-red-400 uppercase tracking-wider mb-3`}>Deductions</Text>

                                            {deductionComponents.length === 0 && !isEditing && (
                                                <Text style={tw`text-xs text-gray-400 italic py-2`}>No deductions applied</Text>
                                            )}

                                            {/* Deduction Components List */}
                                            {deductionComponents.map((comp: any) => (
                                                <View key={comp.id} style={tw`flex-row justify-between items-center py-2.5 border-b border-gray-200 dark:border-white/10`}>
                                                    <View>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{comp.name}</Text>
                                                        <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                            {comp.calculationType === 'FLAT' ? 'Fixed' : `${comp.value}% of Basic`}
                                                        </Text>
                                                    </View>
                                                    <View style={tw`flex-row items-center gap-3`}>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                                            ₹ {getComponentAmount(comp).toLocaleString('en-IN')}
                                                        </Text>
                                                        {isEditing && (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setSelectedSalaryComponents(prev => prev.filter(c => String(c.id) !== String(comp.id)));
                                                                }}
                                                                style={tw`p-1.5 bg-red-500/10 rounded-lg`}
                                                            >
                                                                <Trash2 size={14} color="#ef4444" />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}

                                            {/* Add Deductions Component Button */}
                                            {isEditing && (
                                                <TouchableOpacity
                                                    onPress={() => setComponentPickerType('DEDUCTION')}
                                                    style={tw`mt-3 py-2.5 rounded-xl border border-dashed border-red-500/40 items-center justify-center bg-red-500/5`}
                                                >
                                                    <Text style={tw`text-xs font-bold text-red-500 dark:text-red-400`}>+ Add Deduction Component</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })()}

                        {activeTab === 'shifts' && (
                            <View>
                                <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Shift & Roster</Text>
                                <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-300 uppercase mb-3`}>
                                    {isEditing ? 'Select Shift to Assign' : 'Assigned Shift'}
                                </Text>

                                {isEditing ? (
                                    <View style={tw`gap-3`}>
                                        {shifts.map((shift: any) => {
                                            const isSelected = String(formShiftId) === String(shift.id);
                                            return (
                                                <TouchableOpacity
                                                    key={shift.id}
                                                    onPress={() => setFormShiftId(shift.id)}
                                                    style={tw`p-4 rounded-2xl border ${isSelected ? 'border-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-gray-100 dark:border-white/5 bg-[#f5f3ff] dark:bg-[#111827]'}`}
                                                >
                                                    <View style={tw`flex-row justify-between items-center mb-2`}>
                                                        <Text style={tw`text-base font-bold ${isSelected ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'} capitalize`}>
                                                            {shift.name}
                                                        </Text>
                                                        {isSelected && (
                                                            <View style={tw`w-5 h-5 rounded-full bg-[#8b5cf6] items-center justify-center`}>
                                                                <Check size={12} color="#fff" />
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View style={tw`flex-row justify-between mb-1`}>
                                                        <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Timing:</Text>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{shift.startTime} - {shift.endTime}</Text>
                                                    </View>
                                                    <View style={tw`flex-row justify-between mb-1`}>
                                                        <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Break:</Text>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{shift.breakDuration} mins</Text>
                                                    </View>
                                                    <View style={tw`flex-row justify-between`}>
                                                        <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Night Shift:</Text>
                                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{shift.isNightShift ? 'Yes' : 'No'}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5`}>
                                        <Text style={tw`text-base font-bold text-[#8b5cf6] mb-3 capitalize`}>{profile.shift?.name || 'morning'}</Text>

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Timing:</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{profile.shift?.startTime || '09:00'} - {profile.shift?.endTime || '18:00'}</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Break:</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{profile.shift?.breakDuration || 60} mins</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Grace Time:</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{profile.shift?.graceTime || 15} mins</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Night Shift:</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{profile.shift?.isNightShift ? 'Yes' : 'No'}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'team' && (
                            <View>
                                {Array.isArray(employee?.teams) && employee.teams.length > 0 ? (
                                    employee.teams.map((t: any, idx: number) => {
                                        return (
                                            <View key={idx} style={tw`bg-[#f5f3ff] dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-3`}>
                                                <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-purple-300 uppercase mb-0.5`}>Team Name</Text>
                                                <Text style={tw`text-sm font-bold text-[#8b5cf6] mb-1`}>{t.name}</Text>
                                                {t.description ? <Text style={tw`text-xs text-gray-500 mb-3`}>{t.description}</Text> : null}

                                                <View style={tw`flex-row justify-between mb-2`}>
                                                    <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Name</Text>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.name || 'System Admin'}</Text>
                                                </View>

                                                <View style={tw`flex-row justify-between mb-2`}>
                                                    <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Email</Text>
                                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.email || 'admin@example.com'}</Text>
                                                </View>

                                                <View style={tw`flex-row justify-between`}>
                                                    <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Phone</Text>
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
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Name</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>System Admin</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between mb-2`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Email</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>admin@example.com</Text>
                                        </View>

                                        <View style={tw`flex-row justify-between`}>
                                            <Text style={tw`text-xs text-gray-400 dark:text-purple-200`}>Team Manager Phone</Text>
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
                            onPress={() => setShowIDCardModal(true)}
                            style={tw`flex-row items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/10 rounded-2xl border border-gray-100 dark:border-white/5`}
                        >
                            <User size={18} color={isDark ? '#fff' : '#8b5cf6'} />
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>ID Card Preview</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>



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

                {/* ID Card Preview Modal */}
                <Modal
                    visible={showIDCardModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowIDCardModal(false)}
                >
                    <View style={tw`flex-1 bg-black/85 justify-center items-center p-4`}>
                        <View style={tw`relative items-center`}>
                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={() => setShowIDCardModal(false)}
                                style={tw`absolute -top-10 right-0 p-2 z-50`}
                            >
                                <X size={24} color="#ffffff" />
                            </TouchableOpacity>

                            {/* ID Card Container */}
                            <View style={tw`w-[320px] h-[540px] bg-white rounded-3xl overflow-hidden relative flex-col shadow-2xl`}>
                                {/* Purple Header */}
                                <View style={tw`absolute top-0 inset-x-0 h-44 rounded-b-[40px] bg-[#5b21b6] z-0`} />
                                <View style={tw`mx-auto w-16 h-2.5 bg-white/20 rounded-full mt-4 relative z-10`} />

                                <View style={tw`flex-row justify-between items-start mb-2 px-6 pt-2 relative z-10`}>
                                    <Text style={tw`text-white font-bold text-lg tracking-widest`}>
                                        EnCalm <Text style={tw`text-purple-300`}>HRX</Text>
                                    </Text>
                                    <View style={tw`w-10 h-7 bg-amber-400 rounded-md border border-yellow-200/50 shadow-sm`} />
                                </View>

                                {/* Profile Avatar */}
                                <View style={tw`relative z-10 mx-auto mt-4`}>
                                    <View style={tw`w-28 h-28 rounded-full border-4 border-white bg-[#7c3aed] shadow-lg overflow-hidden items-center justify-center`}>
                                        {profilePictureUrl && !profileImgError ? (
                                            <Image
                                                source={{ uri: profilePictureUrl }}
                                                style={tw`w-full h-full`}
                                                resizeMode="cover"
                                                onError={() => setProfileImgError(true)}
                                            />
                                        ) : (
                                            <Text style={tw`text-white font-bold text-3xl`}>{initials}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Employee Info */}
                                <View style={tw`mt-3 items-center flex-1`}>
                                    <Text style={tw`text-xl font-bold text-gray-800 px-4 text-center`}>{employee.name}</Text>
                                    <Text style={tw`text-purple-600 font-bold text-xs mt-1`}>{profile.title || 'Employee'}</Text>
                                    <View style={tw`w-12 h-1 bg-purple-200 rounded-full my-3`} />

                                    {/* Details Grid */}
                                    <View style={tw`w-full px-7 gap-y-2.5`}>
                                        <View style={tw`flex-row justify-between`}>
                                            <View style={tw`flex-1 mr-2`}>
                                                <Text style={tw`text-[9px] text-gray-400 uppercase font-bold`}>Employee ID</Text>
                                                <Text style={tw`text-xs font-semibold text-gray-700`}>{employee.id}</Text>
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`text-[9px] text-gray-400 uppercase font-bold`}>Blood Group</Text>
                                                <Text style={tw`text-xs font-semibold text-gray-700`}>{profile.bloodGroup || 'N/A'}</Text>
                                            </View>
                                        </View>

                                        <View style={tw`flex-row justify-between`}>
                                            <View style={tw`flex-1 mr-2`}>
                                                <Text style={tw`text-[9px] text-gray-400 uppercase font-bold`}>Department</Text>
                                                <Text style={tw`text-xs font-semibold text-gray-700`} numberOfLines={1}>{profile.department || 'N/A'}</Text>
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`text-[9px] text-gray-400 uppercase font-bold`}>Mobile Number</Text>
                                                <Text style={tw`text-xs font-semibold text-gray-700`}>{profile.phone || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Footer Section with QR Code & Admin Signature */}
                                <View style={tw`bg-white px-6 pb-4 pt-2 flex-row justify-between items-center mt-auto border-t border-gray-100`}>
                                    <View style={tw`w-14 h-14 bg-white p-1 rounded-lg border border-gray-200 items-center justify-center overflow-hidden`}>
                                        <Image
                                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Employee ID: ${employee.id}\nName: ${employee.name}\nRole: ${profile.title || 'Employee'}\nDept: ${profile.department || 'N/A'}`)}` }}
                                            style={tw`w-full h-full`}
                                            resizeMode="contain"
                                        />
                                    </View>

                                    <View style={tw`items-end justify-end`}>
                                        {!!adminSignatureUrl && (
                                            <Image
                                                source={{ uri: adminSignatureUrl }}
                                                style={tw`w-24 h-8`}
                                                resizeMode="contain"
                                            />
                                        )}
                                        <Text style={tw`text-[11px] italic text-gray-400 leading-tight mt-0.5`}>
                                            Authorized Sig.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Print / Export Button */}
                            <TouchableOpacity
                                onPress={exportIDCardPDF}
                                style={tw`mt-5 flex-row items-center gap-2 px-6 py-2.5 bg-white rounded-full shadow-lg self-center`}
                            >
                                <Printer size={18} color="#1f2937" />
                                <Text style={tw`text-xs font-bold text-gray-800`}>Print / Share ID Card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Role Picker Modal */}
                <Modal visible={showRolePicker} transparent animationType="fade" onRequestClose={() => setShowRolePicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowRolePicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                            <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                                <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select System Role</Text>
                                <TouchableOpacity onPress={() => setShowRolePicker(false)}>
                                    <X size={20} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={tw`max-h-80`}>
                                {roles.map((r: any) => (
                                    <TouchableOpacity
                                        key={r.id}
                                        onPress={() => {
                                            setFormRoleId(r.id);
                                            setShowRolePicker(false);
                                        }}
                                        style={tw`py-3 px-4 rounded-xl mb-1.5 flex-row justify-between items-center ${String(formRoleId) === String(r.id) ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${String(formRoleId) === String(r.id) ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{r.name}</Text>
                                        {String(formRoleId) === String(r.id) && <Check size={16} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Designation Picker Modal */}
                <Modal visible={showDesignationPicker} transparent animationType="fade" onRequestClose={() => setShowDesignationPicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowDesignationPicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                            <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                                <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select Designation</Text>
                                <TouchableOpacity onPress={() => setShowDesignationPicker(false)}>
                                    <X size={20} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={tw`max-h-80`}>
                                {designations.map((d: any) => (
                                    <TouchableOpacity
                                        key={d.id}
                                        onPress={() => {
                                            setFormDesignationId(d.id);
                                            setShowDesignationPicker(false);
                                        }}
                                        style={tw`py-3 px-4 rounded-xl mb-1.5 flex-row justify-between items-center ${String(formDesignationId) === String(d.id) ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${String(formDesignationId) === String(d.id) ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{d.name}</Text>
                                        {String(formDesignationId) === String(d.id) && <Check size={16} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Department Picker Modal */}
                <Modal visible={showDepartmentPicker} transparent animationType="fade" onRequestClose={() => setShowDepartmentPicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowDepartmentPicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                            <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                                <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select Department</Text>
                                <TouchableOpacity onPress={() => setShowDepartmentPicker(false)}>
                                    <X size={20} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={tw`max-h-80`}>
                                {departments.map((dept: any) => (
                                    <TouchableOpacity
                                        key={dept.id}
                                        onPress={() => {
                                            setFormDepartmentId(dept.id);
                                            setShowDepartmentPicker(false);
                                        }}
                                        style={tw`py-3 px-4 rounded-xl mb-1.5 flex-row justify-between items-center ${String(formDepartmentId) === String(dept.id) ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${String(formDepartmentId) === String(dept.id) ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{dept.name}</Text>
                                        {String(formDepartmentId) === String(dept.id) && <Check size={16} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Blood Group Picker Modal */}
                <Modal visible={showBloodGroupPicker} transparent animationType="fade" onRequestClose={() => setShowBloodGroupPicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowBloodGroupPicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                            <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                                <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select Blood Group</Text>
                                <TouchableOpacity onPress={() => setShowBloodGroupPicker(false)}>
                                    <X size={20} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={tw`max-h-80`}>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg: string) => (
                                    <TouchableOpacity
                                        key={bg}
                                        onPress={() => {
                                            setFormBloodGroup(bg);
                                            setShowBloodGroupPicker(false);
                                        }}
                                        style={tw`py-3 px-4 rounded-xl mb-1.5 flex-row justify-between items-center ${formBloodGroup === bg ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${formBloodGroup === bg ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{bg}</Text>
                                        {formBloodGroup === bg && <Check size={16} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Salary Component Add Picker Modal */}
                <Modal visible={componentPickerType !== null} transparent animationType="fade" onRequestClose={() => setComponentPickerType(null)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setComponentPickerType(null)} style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                            <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                                <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>
                                    Add {componentPickerType === 'EARNING' ? 'Earnings' : 'Deductions'} Component
                                </Text>
                                <TouchableOpacity onPress={() => setComponentPickerType(null)}>
                                    <X size={20} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={tw`max-h-80`}>
                                {salaryComponents
                                    .filter((c: any) => c.type === componentPickerType)
                                    .filter((c: any) => !selectedSalaryComponents.some((item: any) => String(item.id) === String(c.id)))
                                    .map((c: any) => (
                                        <TouchableOpacity
                                            key={c.id}
                                            onPress={() => {
                                                setSelectedSalaryComponents(prev => [...prev, c]);
                                                setComponentPickerType(null);
                                            }}
                                            style={tw`py-3.5 px-4 bg-gray-50 dark:bg-white/5 rounded-xl mb-2 flex-row justify-between items-center`}
                                        >
                                            <View>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{c.name}</Text>
                                                <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                    {c.calculationType === 'FLAT' ? 'Fixed Amount' : `${c.value}% of Basic`}
                                                </Text>
                                            </View>
                                            <View style={tw`px-2.5 py-1 rounded-full ${componentPickerType === 'EARNING' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                <Text style={tw`text-[9px] font-bold ${componentPickerType === 'EARNING' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    + ADD
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}

                                {salaryComponents
                                    .filter((c: any) => c.type === componentPickerType)
                                    .filter((c: any) => !selectedSalaryComponents.some((item: any) => String(item.id) === String(c.id))).length === 0 && (
                                        <Text style={tw`text-xs text-gray-400 text-center py-6 italic`}>
                                            No available {componentPickerType?.toLowerCase()} components to add.
                                        </Text>
                                    )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        setShowDeleteModal(false);
                        setDeleteTarget(null);
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => {
                            setShowDeleteModal(false);
                            setDeleteTarget(null);
                        }}
                        style={tw`flex-1 bg-black/60 justify-center items-center px-4`}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={tw`bg-white dark:bg-[#0B0A1F] border border-gray-100 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-xl`}
                        >
                            <View style={tw`w-12 h-12 rounded-full bg-red-500/10 items-center justify-center mb-4 self-center`}>
                                <Trash2 size={24} color="#ef4444" />
                            </View>

                            <Text style={tw`text-base font-bold text-gray-900 dark:text-white text-center mb-2`}>
                                Delete {deleteTarget?.name || 'Item'}?
                            </Text>
                            <Text style={tw`text-xs text-gray-500 dark:text-purple-200 text-center mb-6`}>
                                Are you sure you want to delete {deleteTarget?.name || 'this item'}? This action cannot be undone.
                            </Text>

                            <View style={tw`flex-row gap-3`}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                    style={tw`flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-xl items-center`}
                                >
                                    <Text style={tw`text-xs font-bold text-gray-700 dark:text-gray-200`}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={confirmDelete}
                                    style={tw`flex-1 py-3 bg-red-500 rounded-xl items-center shadow-lg shadow-red-500/20`}
                                >
                                    <Text style={tw`text-xs font-bold text-white`}>Yes, Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

            </View>
        </KeyboardAvoidingView>
    );
}
