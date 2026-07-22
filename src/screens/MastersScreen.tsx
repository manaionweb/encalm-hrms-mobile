import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Edit2, Trash2, Lock, Check } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';

import { useToast } from '../context/ToastContext';

type MainTab = 'ORG' | 'PAYROLL' | 'SHIFTS' | 'ACCESS' | 'CUSTOM';

export default function MastersScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('ORG');
    const [activeSubTab, setActiveSubTab] = useState<string>('Company');
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<any[]>([]);

    // Company Settings Form State
    const [legalName, setLegalName] = useState('');
    const [cin, setCin] = useState('');
    const [gstin, setGstin] = useState('');
    const [pan, setPan] = useState('');
    const [tan, setTan] = useState('');
    const [address, setAddress] = useState('');
    const [website, setWebsite] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#6366f1');
    const [secondaryColor, setSecondaryColor] = useState('#ec4899');
    const [savingCompany, setSavingCompany] = useState(false);

    // Signature Form State
    const [signatoryName, setSignatoryName] = useState('');
    const [signatoryTitle, setSignatoryTitle] = useState('HR Admin');
    const [serverSignatureImage, setServerSignatureImage] = useState<string | null>(null);
    const [selectedSignatureFile, setSelectedSignatureFile] = useState<any>(null);
    const [savingSignature, setSavingSignature] = useState(false);

    // Statutory Settings (Compliance) Form State
    const [epfEnabled, setEpfEnabled] = useState(true);
    const [epfNumber, setEpfNumber] = useState('');
    const [epfWageCeiling, setEpfWageCeiling] = useState(true);
    const [pfCeilingType, setPfCeilingType] = useState('STATUTORY_15K');
    const [epfEmployeeRate, setEpfEmployeeRate] = useState('12');
    const [epfEmployerRate, setEpfEmployerRate] = useState('3.67');
    const [epsEmployerRate, setEpsEmployerRate] = useState('8.33');
    const [edliEmployerRate, setEdliEmployerRate] = useState('0.5');
    const [adminChargesRate, setAdminChargesRate] = useState('0.5');
    const [esicEnabled, setEsicEnabled] = useState(true);
    const [esicNumber, setEsicNumber] = useState('');
    const [esicWageLimit, setEsicWageLimit] = useState('21000');
    const [esicEmployeeRate, setEsicEmployeeRate] = useState('0.75');
    const [esicEmployerRate, setEsicEmployerRate] = useState('3.25');
    const [savingStatutory, setSavingStatutory] = useState(false);

    // Attendance Rules (Policy) Form State
    const [minHalfDayHours, setMinHalfDayHours] = useState('4');
    const [minFullDayHours, setMinFullDayHours] = useState('8');
    const [lateMarkThreshold, setLateMarkThreshold] = useState('3');
    const [lateMarkDeduction, setLateMarkDeduction] = useState('HALF_DAY');
    const [otEnabled, setOtEnabled] = useState(true);
    const [savingPolicy, setSavingPolicy] = useState(false);

    // Sandwich Rule Form State
    const [sandwichEnabled, setSandwichEnabled] = useState(false);
    const [applyOnWeekends, setApplyOnWeekends] = useState(false);
    const [applyOnHolidays, setApplyOnHolidays] = useState(false);
    const [applyCasualLeave, setApplyCasualLeave] = useState(false);
    const [applySickLeave, setApplySickLeave] = useState(false);
    const [applyEarnedLeave, setApplyEarnedLeave] = useState(false);
    const [savingSandwich, setSavingSandwich] = useState(false);

    // Add Record Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<any | null>(null);
    const [addName, setAddName] = useState('');
    const [addDescription, setAddDescription] = useState('');
    const [addAddress, setAddAddress] = useState('');
    const [addCity, setAddCity] = useState('');
    const [addType, setAddType] = useState('');
    const [addFormula, setAddFormula] = useState('');
    const [addInTime, setAddInTime] = useState('09:00');
    const [addOutTime, setAddOutTime] = useState('18:00');
    const [addGracePeriod, setAddGracePeriod] = useState('15');
    const [addDate, setAddDate] = useState('');
    const [addState, setAddState] = useState('');
    const [addCountry, setAddCountry] = useState('India');
    const [addPincode, setAddPincode] = useState('');
    const [addCategory, setAddCategory] = useState('PERSONAL_DETAILS');
    const [addOptions, setAddOptions] = useState('');
    const [submittingAdd, setSubmittingAdd] = useState(false);

    // Add Salary Component states
    const [compTaxability, setCompTaxability] = useState('Taxable');
    const [compCalculation, setCompCalculation] = useState('Flat Amount');
    const [compValue, setCompValue] = useState('0');
    const [isBasicPay, setIsBasicPay] = useState(false);
    const [partOfPf, setPartOfPf] = useState(false);
    const [fbpEligible, setFbpEligible] = useState(false);

    // Add Shift states
    const [addBreakDuration, setAddBreakDuration] = useState('60');
    const [addIsNightShift, setAddIsNightShift] = useState(false);

    // Access Control Role States
    const [editingRole, setEditingRole] = useState<any>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

    const mainTabs = [
        { key: 'ORG', label: 'Organization' },
        { key: 'PAYROLL', label: 'Statutory & Payroll' },
        { key: 'SHIFTS', label: 'Shifts & Holidays' },
        { key: 'ACCESS', label: 'Access Control' },
        { key: 'CUSTOM', label: 'Custom Fields' }
    ];

    const modulesList = [
        { key: 'DASHBOARD', label: 'Dashboard' },
        { key: 'ATTENDANCE', label: 'Attendance' },
        { key: 'EMPLOYEE', label: 'Employee' },
        { key: 'TEAM', label: 'Team' },
        { key: 'LEAVE', label: 'Leave' },
        { key: 'REPORTS', label: 'Reports' },
        { key: 'MASTERS', label: 'Masters' },
        { key: 'TASK', label: 'Task' }
    ];

    const getSubTabs = () => {
        if (activeMainTab === 'ORG') {
            return ['Company', 'Locations', 'Departments', 'Designations', 'Signature'];
        }
        if (activeMainTab === 'PAYROLL') {
            return ['Salary Components', 'Compliance Settings', 'Professional Tax'];
        }
        if (activeMainTab === 'SHIFTS') {
            return ['Shifts & Rosters', 'Holidays', 'Attendance Rules', 'Sandwich Rule'];
        }
        if (activeMainTab === 'CUSTOM') {
            return ['Personal Details', 'Document Vault'];
        }
        return [];
    };

    const loadCompanyInfo = async () => {
        try {
            const res = await api.get('/masters/company');
            if (res.data && res.data.id) {
                setCompanyId(res.data.id);
            }
        } catch (e) {
            console.error('Failed to pre-fetch company ID:', e);
        }
    };

    useEffect(() => {
        loadCompanyInfo();
    }, []);

    const fetchCompanyData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/masters/company');
            const c = res.data || {};
            setLegalName(c.legalName || 'encalm it');
            setCin(c.cin || '');
            setGstin(c.gstin || '');
            setPan(c.pan || '');
            setTan(c.tan || '');
            setAddress(c.regAddress || '');
            setWebsite(c.website || '');
            setPrimaryColor(c.primaryColor || '#6366f1');
            setSecondaryColor(c.secondaryColor || '#ec4899');
            if (c.id) setCompanyId(c.id);
        } catch (e) {
            console.error('Error loading company master:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        setSavingCompany(true);
        try {
            await api.post('/masters/company', {
                legalName,
                cin,
                gstin,
                pan,
                tan,
                regAddress: address,
                website,
                primaryColor,
                secondaryColor
            });
            showToast('Legal entity details updated successfully.', 'success');
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Failed to update company settings', 'error');
        } finally {
            setSavingCompany(false);
        }
    };

    const fetchSignatureSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/company-setting');
            setSignatoryName(res.data.authorizedSignName || '');
            setSignatoryTitle(res.data.authorizedSignTitle || 'HR Admin');
            setServerSignatureImage(res.data.authorizedSignature || null);
            setSelectedSignatureFile(null);
        } catch (e) {
            console.error('Failed to load digital signature settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFile = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['image/png', 'image/jpeg', 'image/jpg'],
                copyToCacheDirectory: true
            });

            if (res.canceled) return;

            const asset = res.assets[0];
            setSelectedSignatureFile({
                uri: asset.uri,
                name: asset.name || 'signature.png',
                type: asset.mimeType || 'image/png'
            });
        } catch (error) {
            console.error('Failed to pick signature document:', error);
            showToast('Failed to pick image file.', 'error');
        }
    };

    const handleSaveSignature = async () => {
        if (!signatoryName.trim()) {
            showToast('Please enter the authorized signatory name.', 'error');
            return;
        }

        setSavingSignature(true);
        try {
            const formData = new FormData();
            formData.append('authorizedSignName', signatoryName.trim());
            formData.append('authorizedSignTitle', signatoryTitle.trim());

            if (selectedSignatureFile) {
                formData.append('signature', {
                    uri: selectedSignatureFile.uri,
                    name: selectedSignatureFile.name,
                    type: selectedSignatureFile.type
                } as any);
            }

            await api.post('/company-setting/authorized-signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showToast('Authorized signature updated successfully.', 'success');
            fetchSignatureSettings();
        } catch (e: any) {
            console.error('Error saving signature settings:', e);
            showToast(e.response?.data?.message || 'Failed to save authorized signature settings.', 'error');
        } finally {
            setSavingSignature(false);
        }
    };

    const handleDeleteSignature = async () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete the authorized signature image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/company-setting/signature');
                            setServerSignatureImage(null);
                            setSelectedSignatureFile(null);
                            showToast('Authorized signature deleted successfully.', 'success');
                        } catch (e) {
                            showToast('Failed to delete signature.', 'error');
                        }
                    }
                }
            ]
        );
    };

    const fetchStatutorySettingsForm = async () => {
        setLoading(true);
        try {
            const res = await api.get('/masters/statutory-settings');
            const s = res.data || {};
            setEpfEnabled(s.epfEnabled ?? true);
            setEpfNumber(s.epfNumber || '');
            setEpfWageCeiling(s.epfWageCeiling ?? true);
            setPfCeilingType(s.pfCeilingType || 'STATUTORY_15K');
            setEpfEmployeeRate(String(s.epfEmployeeRate ?? 12));
            setEpfEmployerRate(String(s.epfEmployerRate ?? 3.67));
            setEpsEmployerRate(String(s.epsEmployerRate ?? 8.33));
            setEdliEmployerRate(String(s.edliEmployerRate ?? 0.5));
            setAdminChargesRate(String(s.adminChargesRate ?? 0.5));

            setEsicEnabled(s.esicEnabled ?? true);
            setEsicNumber(s.esicNumber || '');
            setEsicWageLimit(String(s.esicWageLimit ?? 21000));
            setEsicEmployeeRate(String(s.esicEmployeeRate ?? 0.75));
            setEsicEmployerRate(String(s.esicEmployerRate ?? 3.25));
        } catch (e) {
            console.error('Failed to load statutory compliance configurations:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStatutory = async () => {
        setSavingStatutory(true);
        try {
            await api.post('/masters/statutory-settings', {
                epfEnabled,
                epfNumber,
                epfWageCeiling,
                pfCeilingType,
                epfEmployeeRate: Number(epfEmployeeRate) || 0,
                epfEmployerRate: Number(epfEmployerRate) || 0,
                epsEmployerRate: Number(epsEmployerRate) || 0,
                edliEmployerRate: Number(edliEmployerRate) || 0,
                adminChargesRate: Number(adminChargesRate) || 0,
                esicEnabled,
                esicNumber,
                esicWageLimit: Number(esicWageLimit) || 0,
                esicEmployeeRate: Number(esicEmployeeRate) || 0,
                esicEmployerRate: Number(esicEmployerRate) || 0,
            });
            showToast('Statutory compliance configuration updated successfully.', 'success');
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Failed to update compliance settings.', 'error');
        } finally {
            setSavingStatutory(false);
        }
    };

    const fetchAttendanceRulesForm = async () => {
        setLoading(true);
        try {
            const res = await api.get('/masters/attendance-policy');
            const p = res.data || {};
            setMinHalfDayHours(String(p.minHalfDayHours ?? 4));
            setMinFullDayHours(String(p.minFullDayHours ?? 8));
            setLateMarkThreshold(String(p.lateMarkThreshold ?? 3));
            setLateMarkDeduction(p.lateMarkDeduction || 'HALF_DAY');
            setOtEnabled(p.otEnabled ?? true);
        } catch (e) {
            console.error('Failed to load attendance policy:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAttendanceRules = async () => {
        setSavingPolicy(true);
        try {
            await api.post('/masters/attendance-policy', {
                minHalfDayHours: Number(minHalfDayHours) || 4.0,
                minFullDayHours: Number(minFullDayHours) || 8.0,
                lateMarkThreshold: Number(lateMarkThreshold) || 3,
                lateMarkDeduction,
                otEnabled,
            });
            showToast('Attendance policy rules updated successfully.', 'success');
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Failed to save attendance policy settings.', 'error');
        } finally {
            setSavingPolicy(false);
        }
    };

    const fetchSandwichRules = async () => {
        setLoading(true);
        try {
            const val = await AsyncStorage.getItem('sandwich_rules');
            if (val) {
                const parsed = JSON.parse(val);
                setSandwichEnabled(parsed.sandwichEnabled ?? false);
                setApplyOnWeekends(parsed.applyOnWeekends ?? false);
                setApplyOnHolidays(parsed.applyOnHolidays ?? false);
                setApplyCasualLeave(parsed.applyCasualLeave ?? false);
                setApplySickLeave(parsed.applySickLeave ?? false);
                setApplyEarnedLeave(parsed.applyEarnedLeave ?? false);
            }
        } catch (e) {
            console.error('Failed to load sandwich rules:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSandwich = async () => {
        setSavingSandwich(true);
        try {
            const rules = {
                sandwichEnabled,
                applyOnWeekends,
                applyOnHolidays,
                applyCasualLeave,
                applySickLeave,
                applyEarnedLeave,
            };
            await AsyncStorage.setItem('sandwich_rules', JSON.stringify(rules));
            showToast('Sandwich rules saved successfully.', 'success');
        } catch (e) {
            showToast('Failed to save sandwich rules.', 'error');
        } finally {
            setSavingSandwich(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/masters/permissions');
            setPermissions(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Failed to load granular permissions:', e);
        }
    };

    const fetchListData = async (endpoint: string) => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            setDataList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(`Error loading endpoint ${endpoint}:`, e);
            setDataList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomFieldsList = async () => {
        setLoading(true);
        try {
            const res = await api.get('/custom-fields/masters');
            const allFields = Array.isArray(res.data) ? res.data : [];
            const cat = activeSubTab === 'Document Vault' ? 'DOCUMENT_VAULT' : 'PERSONAL_DETAILS';
            setDataList(allFields.filter((f: any) => f.category === cat));
        } catch (e) {
            console.error('Error loading custom fields:', e);
            setDataList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomField = (id: string, name: string) => {
        setFieldToDelete({ id, name });
    };

    const resetAddForm = () => {
        setAddName('');
        setAddDescription('');
        setAddAddress('');
        setAddCity('');
        setAddType('');
        setAddFormula('');
        setAddInTime('09:00');
        setAddOutTime('18:00');
        setAddGracePeriod('15');
        setAddDate(new Date().toISOString().substring(0, 10));
        setAddState('');
        setAddCountry('India');
        setAddPincode('');
        setAddCategory('PERSONAL_DETAILS');
        setAddOptions('');
        setCompTaxability('Taxable');
        setCompCalculation('Flat Amount');
        setCompValue('0');
        setIsBasicPay(false);
        setPartOfPf(false);
        setFbpEligible(false);
        setAddBreakDuration('60');
        setAddIsNightShift(false);
        setEditingRole(null);
        setSelectedModules([]);
        setSelectedPermissions([]);
    };

    const shouldShowAddButton = () => {
        if (activeMainTab === 'ORG') {
            return activeSubTab === 'Locations' || activeSubTab === 'Departments' || activeSubTab === 'Designations';
        }
        if (activeMainTab === 'PAYROLL') {
            return activeSubTab === 'Salary Components' || activeSubTab === 'Professional Tax';
        }
        if (activeMainTab === 'SHIFTS') {
            return activeSubTab === 'Shifts & Rosters' || activeSubTab === 'Holidays';
        }
        if (activeMainTab === 'ACCESS') return true;
        if (activeMainTab === 'CUSTOM') return true;
        return false;
    };

    const handleCreateRoleClick = () => {
        resetAddForm();
        setEditingRole(null);
        setSelectedModules(['DASHBOARD']);
        setSelectedPermissions([]);
        setShowAddModal(true);
    };

    const handleEditRole = (role: any) => {
        setEditingRole(role);
        setAddName(role.name);
        setSelectedModules(role.accessibleModules ? role.accessibleModules.split(',') : []);
        setSelectedPermissions(role.permissions ? role.permissions.map((p: any) => p.id) : []);
        setShowAddModal(true);
    };

    const handleDeleteRole = (roleId: number, roleName: string) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete the role "${roleName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/masters/roles/${roleId}`);
                            showToast('Role deleted successfully.', 'success');
                            fetchListData('/masters/roles');
                        } catch (e) {
                            showToast('Failed to delete role.', 'error');
                        }
                    }
                }
            ]
        );
    };

    const toggleModuleSelection = (moduleKey: string) => {
        if (selectedModules.includes(moduleKey)) {
            setSelectedModules(selectedModules.filter(m => m !== moduleKey));
        } else {
            setSelectedModules([...selectedModules, moduleKey]);
        }
    };

    const togglePermissionSelection = (permissionId: string) => {
        if (selectedPermissions.includes(permissionId)) {
            setSelectedPermissions(selectedPermissions.filter(pid => pid !== permissionId));
        } else {
            setSelectedPermissions([...selectedPermissions, permissionId]);
        }
    };

    const handleAddSubmit = async () => {
        if (!addName.trim()) {
            showToast('Please fill in the required name.', 'error');
            return;
        }

        if (activeMainTab === 'ORG' && activeSubTab === 'Locations') {
            if (!addAddress.trim() || !addCity.trim() || !addState.trim() || !addCountry.trim() || !addPincode.trim()) {
                showToast('Please fill in all location fields (Address, City, State, Country, and Pincode).', 'error');
                return;
            }
        }

        setSubmittingAdd(true);
        try {
            let endpoint = '';
            let payload: any = {};

            if (activeMainTab === 'ACCESS') {
                const payload = {
                    name: addName.trim(),
                    accessibleModules: selectedModules.join(','),
                    permissionIds: selectedPermissions
                };

                if (editingRole) {
                    await api.put(`/masters/roles/${editingRole.id}`, payload);
                    showToast('Role updated successfully.', 'success');
                } else {
                    await api.post('/masters/roles', payload);
                    showToast('Role created successfully.', 'success');
                }
                setShowAddModal(false);
                resetAddForm();
                fetchListData('/masters/roles');
                return;
            }

            if (activeMainTab === 'ORG') {
                if (activeSubTab === 'Locations') {
                    endpoint = '/masters/locations';
                    payload = { 
                        name: addName.trim(), 
                        address: addAddress.trim(), 
                        city: addCity.trim(), 
                        state: addState.trim(),
                        country: addCountry.trim(),
                        pincode: addPincode.trim(),
                        companyId 
                    };
                } else if (activeSubTab === 'Departments') {
                    endpoint = '/masters/departments';
                    payload = { name: addName.trim(), companyId };
                } else if (activeSubTab === 'Designations') {
                    endpoint = '/masters/designations';
                    payload = { name: addName.trim(), companyId };
                }
            } else if (activeMainTab === 'PAYROLL') {
                if (activeSubTab === 'Salary Components') {
                    endpoint = '/masters/salary-components';
                    payload = { 
                        name: addName.trim(), 
                        type: (addType || 'Earning').toUpperCase(), 
                        taxability: compTaxability === 'Taxable' ? 'TAXABLE' : 'FULLY_EXEMPT',
                        calculationType: compCalculation === 'Flat Amount' ? 'FLAT' : '%_BASIC',
                        value: Number(compValue) || 0,
                        isWageCodeComponent: isBasicPay,
                        isPartOfWages: partOfPf,
                        isFBP: fbpEligible,
                        description: addDescription.trim() 
                    };
                } else if (activeSubTab === 'Professional Tax') {
                    endpoint = '/masters/professional-tax-slabs';
                    payload = {
                        stateName: addName.trim(),
                        minSalary: Number(addInTime) || 0,
                        maxSalary: Number(addOutTime) || 0,
                        taxAmount: Number(addGracePeriod) || 0
                    };
                }
            } else if (activeMainTab === 'SHIFTS') {
                if (activeSubTab === 'Shifts & Rosters') {
                    endpoint = '/masters/shifts';
                    payload = { 
                        name: addName.trim(), 
                        startTime: addInTime.trim(), 
                        endTime: addOutTime.trim(), 
                        graceTime: Number(addGracePeriod) || 15,
                        breakDuration: Number(addBreakDuration) || 60,
                        isNightShift: addIsNightShift
                    };
                } else if (activeSubTab === 'Holidays') {
                    endpoint = '/masters/holidays';
                    payload = { 
                        name: addName.trim(), 
                        date: addDate.trim() || new Date().toISOString().substring(0, 10), 
                        type: addType || 'PUBLIC', 
                        isOptional: addType === 'OPTIONAL' 
                    };
                }
            } else if (activeMainTab === 'CUSTOM') {
                endpoint = '/custom-fields/masters';
                payload = { 
                    name: addName.trim(), 
                    category: addCategory || (activeSubTab === 'Document Vault' ? 'DOCUMENT_VAULT' : 'PERSONAL_DETAILS'), 
                    type: addType || (activeSubTab === 'Document Vault' ? 'PDF' : 'TEXT'), 
                    options: addOptions.trim() || null 
                };
            }

            if (endpoint) {
                await api.post(endpoint, payload);
                showToast('Record created successfully.', 'success');
                setShowAddModal(false);
                resetAddForm();
                
                // Refresh list
                if (activeMainTab === 'ORG') {
                    if (activeSubTab === 'Locations') fetchListData('/masters/locations');
                    else if (activeSubTab === 'Departments') fetchListData('/masters/departments');
                    else if (activeSubTab === 'Designations') fetchListData('/masters/designations');
                } else if (activeMainTab === 'PAYROLL') {
                    if (activeSubTab === 'Salary Components') fetchListData('/masters/salary-components');
                    else if (activeSubTab === 'Professional Tax') fetchListData('/masters/professional-tax-slabs');
                } else if (activeMainTab === 'SHIFTS') {
                    if (activeSubTab === 'Shifts & Rosters') fetchListData('/masters/shifts');
                    else if (activeSubTab === 'Holidays') fetchListData('/masters/holidays');
                } else if (activeMainTab === 'CUSTOM') {
                    fetchListData('/custom-fields/masters');
                }
            }
        } catch (e: any) {
            showToast(e.response?.data?.error || e.response?.data?.message || 'Failed to create record.', 'error');
        } finally {
            setSubmittingAdd(false);
        }
    };

    useEffect(() => {
        if (activeMainTab === 'ORG') {
            if (activeSubTab === 'Company') {
                fetchCompanyData();
            } else if (activeSubTab === 'Locations') {
                fetchListData('/masters/locations');
            } else if (activeSubTab === 'Departments') {
                fetchListData('/masters/departments');
            } else if (activeSubTab === 'Designations') {
                fetchListData('/masters/designations');
            } else if (activeSubTab === 'Signature') {
                fetchSignatureSettings();
            }
        } else if (activeMainTab === 'PAYROLL') {
            if (activeSubTab === 'Salary Components') {
                fetchListData('/masters/salary-components');
            } else if (activeSubTab === 'Compliance Settings') {
                fetchStatutorySettingsForm();
            } else if (activeSubTab === 'Professional Tax') {
                fetchListData('/masters/professional-tax-slabs');
            }
        } else if (activeMainTab === 'SHIFTS') {
            if (activeSubTab === 'Shifts & Rosters') {
                fetchListData('/masters/shifts');
            } else if (activeSubTab === 'Holidays') {
                fetchListData('/masters/holidays');
            } else if (activeSubTab === 'Attendance Rules') {
                fetchAttendanceRulesForm();
            } else if (activeSubTab === 'Sandwich Rule') {
                fetchSandwichRules();
            }
        } else if (activeMainTab === 'ACCESS') {
            fetchListData('/masters/roles');
            fetchPermissions();
        } else if (activeMainTab === 'CUSTOM') {
            fetchCustomFieldsList();
        }
    }, [activeMainTab, activeSubTab]);

    const renderDetailItem = ({ item }: { item: any }) => {
        let name = item.name || item.title || item.roleName || 'Unnamed Config';

        if (activeMainTab === 'ACCESS') {
            const permissionsCount = item.permissions?.length || 0;
            return (
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl mb-3 border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{item.name}</Text>
                            <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>{permissionsCount} Permissions Assigned</Text>
                        </View>
                        <View style={tw`flex-row gap-2`}>
                            <TouchableOpacity
                                onPress={() => handleEditRole(item)}
                                style={tw`p-2 bg-gray-50 dark:bg-[#111827] rounded-xl`}
                            >
                                <Edit2 size={12} color="#8b5cf6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDeleteRole(item.id, item.name)}
                                style={tw`p-2 bg-red-50 dark:bg-red-500/5 rounded-xl`}
                            >
                                <Trash2 size={12} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Permissions Preview */}
                    <View style={tw`gap-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5`}>
                        {item.permissions && item.permissions.slice(0, 3).map((p: any) => (
                            <View key={p.id} style={tw`flex-row items-center gap-2`}>
                                <Check size={10} color="#22c55e" />
                                <Text style={tw`text-[11px] text-gray-600 dark:text-gray-300`}>{p.name}</Text>
                            </View>
                        ))}
                        {permissionsCount > 3 && (
                            <Text style={tw`text-[10px] text-[#8b5cf6] font-bold pl-4`}>+ {permissionsCount - 3} more...</Text>
                        )}
                        {permissionsCount === 0 && (
                            <View style={tw`flex-row items-center gap-1.5`}>
                                <Lock size={10} color="#94a3b8" />
                                <Text style={tw`text-[11px] text-gray-400 italic`}>No specific permissions</Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        if (activeSubTab === 'Shifts & Rosters') {
            return (
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl mb-3 border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <Text style={tw`font-bold text-sm text-gray-900 dark:text-white mb-3`}>{name}</Text>
                    <View style={tw`gap-1.5`}>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-xs text-gray-400 font-bold`}>Timings:</Text>
                            <Text style={tw`text-xs text-[#8b5cf6] font-bold`}>{item.startTime || item.inTime || 'N/A'} - {item.endTime || item.outTime || 'N/A'}</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-xs text-gray-400 font-bold`}>Grace Period:</Text>
                            <Text style={tw`text-xs text-gray-800 dark:text-white font-bold`}>{item.graceTime ?? item.gracePeriod ?? 15} mins</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-xs text-gray-400 font-bold`}>Break:</Text>
                            <Text style={tw`text-xs text-gray-800 dark:text-white font-bold`}>{item.breakDuration ?? 60} mins</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-xs text-gray-400 font-bold`}>Night Shift:</Text>
                            <Text style={tw`text-xs text-gray-800 dark:text-white font-bold`}>{item.isNightShift ? 'Yes' : 'No'}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        if (activeSubTab === 'Holidays') {
            const d = item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            return (
                <View style={tw`flex-row bg-white dark:bg-[#1e293b] py-3.5 px-4 rounded-2xl mb-2 border border-gray-100 dark:border-white/5 items-center`}>
                    <Text style={tw`flex-1 text-xs font-bold text-gray-900 dark:text-white`}>{item.name}</Text>
                    <Text style={tw`flex-1 text-xs text-center text-[#8b5cf6] font-bold`}>{d}</Text>
                    <View style={tw`flex-1 items-end`}>
                        <View style={tw`px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded`}>
                            <Text style={tw`text-[9px] text-gray-500 font-bold uppercase`}>{item.type || 'PUBLIC'}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        if (activeSubTab === 'Professional Tax') {
            return (
                <View style={tw`flex-row bg-white dark:bg-[#1e293b] py-3.5 px-4 rounded-2xl mb-2 border border-gray-100 dark:border-white/5 items-center`}>
                    <Text style={tw`flex-1 text-xs font-bold text-gray-900 dark:text-white`}>{item.stateName || 'PT Slab'}</Text>
                    <Text style={tw`flex-1.5 text-xs text-center text-[#8b5cf6] font-bold`}>₹{item.minSalary} - ₹{item.maxSalary}</Text>
                    <Text style={tw`flex-1 text-xs text-right text-gray-800 dark:text-white font-bold`}>₹{item.taxAmount}</Text>
                </View>
            );
        }

        let detail1 = '';
        let detail2 = '';

        if (activeSubTab === 'Salary Components') {
            const taxLabel = item.taxability === 'FULLY_EXEMPT' ? 'Non-Taxable' : 'Taxable';
            const calcLabel = item.calculationType === 'FLAT' ? 'Flat Amount' : 'Percentage';
            detail1 = `Type: ${item.type || 'Earning'} • Tax: ${taxLabel}`;
            detail2 = `Calculated As: ${calcLabel} (${item.value || 0})`;
        } else if (activeSubTab === 'Locations') {
            detail1 = item.address ? `Address: ${item.address}` : '';
            detail2 = `${item.city || ''}${item.state ? ', ' + item.state : ''}${item.pincode ? ' - ' + item.pincode : ''}`;
        }

        if (activeMainTab === 'CUSTOM') {
            const catLabel = item.category === 'PERSONAL_DETAILS' ? 'Personal Details' : 'Document Vault';
            const typeLabel = item.type === 'RADIO' ? 'Radio Button' : item.type === 'FILE' ? 'File Upload' : item.type === 'PDF' ? 'PDF Document' : item.type;
            return (
                <View style={tw`flex-row bg-white dark:bg-[#4c1d95] py-3.5 px-4 rounded-2xl mb-2 border border-gray-100 dark:border-white/5 items-center`}>
                    <Text style={tw`flex-1 text-xs font-bold text-gray-900 dark:text-white`}>{item.name}</Text>
                    <Text style={tw`flex-1 text-xs text-center text-gray-500 dark:text-gray-300 font-bold`}>{catLabel}</Text>
                    <Text style={tw`flex-1 text-xs text-center text-[#8b5cf6] font-bold`}>{typeLabel}</Text>
                    <View style={tw`w-12 items-end`}>
                        <TouchableOpacity
                            onPress={() => handleDeleteCustomField(item.id, item.name)}
                            style={tw`p-1.5 bg-red-50 dark:bg-red-500/5 rounded-lg`}
                        >
                            <Trash2 size={12} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={tw`bg-white dark:bg-[#1e293b] p-4 rounded-3xl mb-3 border border-gray-100 dark:border-white/5 shadow-sm`}>
                <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{name}</Text>
                {item.description ? <Text style={tw`text-xs text-gray-400 mt-1`}>{item.description}</Text> : null}
                {detail1 ? <Text style={tw`text-xs text-[#8b5cf6] font-bold mt-1.5`}>{detail1}</Text> : null}
                {detail2 ? <Text style={tw`text-xs text-gray-500 font-bold mt-0.5`}>{detail2}</Text> : null}
            </View>
        );
    };

    const renderProfessionalTaxHeader = () => (
        <View style={tw`flex-row bg-gray-100 dark:bg-white/2 py-2.5 px-4 rounded-xl mb-2 border border-gray-200 dark:border-white/5`}>
            <Text style={tw`flex-1 text-[9px] font-black text-gray-400 uppercase`}>State</Text>
            <Text style={tw`flex-1.5 text-[9px] font-black text-gray-400 uppercase text-center`}>Salary Range</Text>
            <Text style={tw`flex-1 text-[9px] font-black text-gray-400 uppercase text-right`}>Tax Amount</Text>
        </View>
    );

    const renderHolidaysHeader = () => (
        <View style={tw`flex-row bg-gray-100 dark:bg-white/2 py-2.5 px-4 rounded-xl mb-2 border border-gray-200 dark:border-white/5`}>
            <Text style={tw`flex-1 text-[9px] font-black text-gray-400 uppercase`}>Holiday Name</Text>
            <Text style={tw`flex-1 text-[9px] font-black text-gray-400 uppercase text-center`}>Date</Text>
            <Text style={tw`flex-1 text-[9px] font-black text-gray-400 uppercase text-right`}>Type</Text>
        </View>
    );

    const renderCustomFieldsHeader = () => (
        <View style={tw`flex-row bg-gray-100 dark:bg-white/2 py-2.5 px-4 rounded-xl mb-2 border border-gray-200 dark:border-white/5`}>
            <Text style={tw`flex-1 text-[11px] font-black text-gray-400 uppercase`}>Field Name</Text>
            <Text style={tw`flex-1 text-[11px] font-black text-gray-400 uppercase text-center`}>Category</Text>
            <Text style={tw`flex-1 text-[11px] font-black text-gray-400 uppercase text-center`}>Type</Text>
            <Text style={tw`w-12 text-[11px] font-black text-gray-400 uppercase text-right`}>Delete</Text>
        </View>
    );

    const renderCompanyForm = () => {
        return (
            <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`} keyboardShouldPersistTaps="handled">
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-900 dark:text-white`}>Legal Entity Details</Text>
                    <TouchableOpacity
                        onPress={handleSaveCompany}
                        disabled={savingCompany}
                        style={tw`px-4 py-2 bg-[#8b5cf6] rounded-xl shadow-sm`}
                    >
                        <Text style={tw`text-xs font-bold text-white`}>
                            {savingCompany ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Corporate Identity */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4`}>Corporate Identity</Text>
                    
                    <View style={tw`mb-3`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Legal Name</Text>
                        <TextInput
                            style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                            value={legalName}
                            onChangeText={setLegalName}
                        />
                    </View>

                    <View style={tw`flex-row gap-3 mb-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>CIN</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={cin}
                                onChangeText={setCin}
                            />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>GSTIN</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={gstin}
                                onChangeText={setGstin}
                            />
                        </View>
                    </View>

                    <View style={tw`flex-row gap-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>PAN</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={pan}
                                onChangeText={setPan}
                            />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>TAN</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={tan}
                                onChangeText={setTan}
                            />
                        </View>
                    </View>
                </View>

                {/* Location & Branding */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4`}>Location & Branding</Text>

                    <View style={tw`mb-3`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Registered Address</Text>
                        <TextInput
                            style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Website</Text>
                        <TextInput
                            style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                            value={website}
                            onChangeText={setWebsite}
                        />
                    </View>

                    <View style={tw`flex-row gap-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Primary Color</Text>
                            <View style={tw`flex-row items-center bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5`}>
                                <View style={[tw`w-4 h-4 rounded mr-2`, { backgroundColor: primaryColor }]} />
                                <TextInput
                                    style={tw`flex-1 text-xs text-gray-800 dark:text-white font-bold h-7 p-0`}
                                    value={primaryColor}
                                    onChangeText={setPrimaryColor}
                                />
                            </View>
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Secondary Color</Text>
                            <View style={tw`flex-row items-center bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5`}>
                                <View style={[tw`w-4 h-4 rounded mr-2`, { backgroundColor: secondaryColor }]} />
                                <TextInput
                                    style={tw`flex-1 text-xs text-gray-800 dark:text-white font-bold h-7 p-0`}
                                    value={secondaryColor}
                                    onChangeText={setSecondaryColor}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderSignatureTab = () => {
        const hostUrl = api.defaults.baseURL?.replace('/api', '') || '';
        const signaturePreviewUri = selectedSignatureFile 
            ? selectedSignatureFile.uri 
            : (serverSignatureImage ? `${hostUrl}${serverSignatureImage}` : null);

        return (
            <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`} keyboardShouldPersistTaps="handled">
                <Text style={tw`text-sm font-black text-gray-900 dark:text-white mb-1`}>Signature Settings</Text>
                <Text style={tw`text-[10px] text-gray-400 dark:text-gray-400 mb-4`}>Manage authorized signature that will be used in official documents.</Text>

                {/* Signatory Name Card */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Authorized Signatory Name *</Text>
                    <TextInput
                        style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                        placeholder="e.g. System Admin"
                        placeholderTextColor="#94a3b8"
                        value={signatoryName}
                        onChangeText={setSignatoryName}
                    />
                </View>

                {/* Upload & Preview Cards */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-6`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Upload Signature</Text>
                    
                    {signaturePreviewUri ? (
                        <View style={tw`relative border border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-4 items-center justify-center bg-gray-50 dark:bg-white/2`}>
                            <View style={tw`absolute top-2 right-2 z-10`}>
                                <TouchableOpacity
                                    onPress={handleDeleteSignature}
                                    style={tw`bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20`}
                                >
                                    <Text style={tw`text-[9px] font-bold text-red-500`}>Delete</Text>
                                </TouchableOpacity>
                            </View>

                            <Image
                                source={{ uri: signaturePreviewUri }}
                                style={[tw`w-full h-32 rounded-xl`, { resizeMode: 'contain' }]}
                            />
                            <Text style={tw`text-[9px] text-gray-400 mt-2 font-bold uppercase`}>Signature Preview</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleSelectFile}
                            style={tw`border border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-8 items-center justify-center bg-gray-50 dark:bg-white/2`}
                        >
                            <View style={tw`w-10 h-10 rounded-full bg-[#8b5cf6]/10 items-center justify-center mb-2`}>
                                <Text style={tw`text-base text-[#8b5cf6] font-bold`}>↑</Text>
                            </View>
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>Choose Signature Image</Text>
                            <Text style={tw`text-[9px] text-gray-400 dark:text-gray-400 mt-1`}>PNG, JPG or JPEG (Max. 2MB)</Text>
                            
                            <View style={tw`mt-4 px-4 py-1.5 bg-[#8b5cf6] rounded-xl`}>
                                <Text style={tw`text-[10px] font-bold text-white uppercase`}>Select File</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Save button */}
                <TouchableOpacity
                    onPress={handleSaveSignature}
                    disabled={savingSignature}
                    style={tw`w-full py-3.5 bg-[#8b5cf6] rounded-2xl items-center shadow-md`}
                >
                    <Text style={tw`text-white font-bold text-xs`}>
                        {savingSignature ? 'Saving Signature...' : 'Save Settings'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderComplianceForm = () => {
        return (
            <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`} keyboardShouldPersistTaps="handled">
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-900 dark:text-white`}>Statutory Configuration</Text>
                    <TouchableOpacity
                        onPress={handleSaveStatutory}
                        disabled={savingStatutory}
                        style={tw`px-4 py-2 bg-[#8b5cf6] rounded-xl shadow-sm`}
                    >
                        <Text style={tw`text-xs font-bold text-white`}>
                            {savingStatutory ? 'Saving...' : 'Save Settings'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* EPF Settings */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest`}>• EPF Settings</Text>
                        <Switch
                            value={epfEnabled}
                            onValueChange={setEpfEnabled}
                            trackColor={{ false: '#cbd5e1', true: '#c4b5fd' }}
                            thumbColor={epfEnabled ? '#8b5cf6' : '#f1f5f9'}
                        />
                    </View>

                    {epfEnabled && (
                        <View>
                            <View style={tw`flex-row gap-3 mb-3`}>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>EPF Number</Text>
                                    <TextInput
                                        style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                        value={epfNumber}
                                        onChangeText={setEpfNumber}
                                    />
                                </View>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Wage Ceiling (₹15,000)</Text>
                                    <TouchableOpacity
                                        onPress={() => setEpfWageCeiling(!epfWageCeiling)}
                                        style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl justify-center h-[38px]`}
                                    >
                                        <Text style={tw`text-xs text-gray-800 dark:text-white font-bold`}>
                                            {epfWageCeiling ? 'Cap at ₹15,000' : 'No Cap'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={tw`flex-row gap-3`}>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Employee Rate (%)</Text>
                                    <TextInput
                                        style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                        value={epfEmployeeRate}
                                        onChangeText={setEpfEmployeeRate}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Employer EPF (%)</Text>
                                    <TextInput
                                        style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                        value={epfEmployerRate}
                                        onChangeText={setEpfEmployerRate}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* ESIC Settings */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-[10px] font-black text-rose-500 uppercase tracking-widest`}>• ESIC Settings</Text>
                        <Switch
                            value={esicEnabled}
                            onValueChange={setEsicEnabled}
                            trackColor={{ false: '#cbd5e1', true: '#c4b5fd' }}
                            thumbColor={esicEnabled ? '#8b5cf6' : '#f1f5f9'}
                        />
                    </View>

                    {esicEnabled && (
                        <View style={tw`flex-row gap-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>ESIC Number</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                    value={esicNumber}
                                    onChangeText={setEsicNumber}
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Wage Limit</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                    value={esicWageLimit}
                                    onChangeText={setEsicWageLimit}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderAttendanceRulesForm = () => {
        return (
            <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`} keyboardShouldPersistTaps="handled">
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-900 dark:text-white`}>Policy Rules</Text>
                    <TouchableOpacity
                        onPress={handleSaveAttendanceRules}
                        disabled={savingPolicy}
                        style={tw`px-4 py-2 bg-[#8b5cf6] rounded-xl shadow-sm`}
                    >
                        <Text style={tw`text-xs font-bold text-white`}>
                            {savingPolicy ? 'Saving...' : 'Save Rules'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Day Status Thresholds Card */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Day Status Thresholds (Hours)</Text>
                    
                    <View style={tw`flex-row gap-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Min Half Day</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={minHalfDayHours}
                                onChangeText={setMinHalfDayHours}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Min Full Day</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                value={minFullDayHours}
                                onChangeText={setMinFullDayHours}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Late Mark Deduction Card */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Late Mark Deduction</Text>
                    
                    <View style={tw`flex-row items-center gap-2 mb-4`}>
                        <Text style={tw`text-xs text-gray-500 font-bold`}>Every</Text>
                        <TextInput
                            style={tw`w-14 px-3 py-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-center text-xs text-gray-800 dark:text-white font-bold h-[34px]`}
                            value={lateMarkThreshold}
                            onChangeText={setLateMarkThreshold}
                            keyboardType="numeric"
                        />
                        <Text style={tw`text-xs text-gray-500 font-bold`}>late marks deduct</Text>
                    </View>

                    <View style={tw`flex-row bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl p-0.5`}>
                        {[
                            { key: 'HALF_DAY', label: '0.5 Day' },
                            { key: 'ONE_DAY', label: '1.0 Day' }
                        ].map((d) => {
                            const isSel = lateMarkDeduction === d.key;
                            return (
                                <TouchableOpacity
                                    key={d.key}
                                    onPress={() => setLateMarkDeduction(d.key)}
                                    style={tw`flex-1 py-2 items-center rounded-lg ${isSel ? 'bg-[#8b5cf6] shadow-sm' : ''}`}
                                >
                                    <Text style={tw`text-xs font-bold ${isSel ? 'text-white' : 'text-gray-400'}`}>{d.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Overtime Card */}
                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Overtime Configuration</Text>
                    
                    {renderCheckbox('Enable Overtime Calculation', otEnabled, setOtEnabled)}
                </View>
            </ScrollView>
        );
    };

    const renderSandwichRuleForm = () => {
        return (
            <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`} keyboardShouldPersistTaps="handled">
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-sm font-black text-gray-900 dark:text-white`}>Sandwich Rule Configuration</Text>
                    <TouchableOpacity
                        onPress={handleSaveSandwich}
                        disabled={savingSandwich}
                        style={tw`px-4 py-2 bg-[#8b5cf6] rounded-xl shadow-sm`}
                    >
                        <Text style={tw`text-xs font-bold text-white`}>
                            {savingSandwich ? 'Saving...' : 'Save Rules'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-5`}>
                    {renderCheckbox('Enable Sandwich Rule', sandwichEnabled, setSandwichEnabled)}
                </View>

                {sandwichEnabled && (
                    <View style={tw`gap-5`}>
                        {/* Apply On Card */}
                        <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                            <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Apply On</Text>
                            {renderCheckbox('Weekends Between Leaves', applyOnWeekends, setApplyOnWeekends)}
                            {renderCheckbox('Holidays Between Leaves', applyOnHolidays, setApplyOnHolidays)}
                        </View>

                        {/* Applicable Leave Types Card */}
                        <View style={tw`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                            <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4`}>Applicable Leave Types</Text>
                            {renderCheckbox('Casual Leave', applyCasualLeave, setApplyCasualLeave)}
                            {renderCheckbox('Sick Leave', applySickLeave, setApplySickLeave)}
                            {renderCheckbox('Earned Leave', applyEarnedLeave, setApplyEarnedLeave)}
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderCheckbox = (label: string, value: boolean, onChange: (v: boolean) => void) => (
        <TouchableOpacity
            onPress={() => onChange(!value)}
            style={tw`flex-row items-center mb-3.5`}
        >
            <View style={tw`w-5 h-5 rounded border ${value ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'border-gray-300 dark:border-white/20'} items-center justify-center mr-3`}>
                {value && <Text style={tw`text-[10px] text-white font-bold`}>✓</Text>}
            </View>
            <Text style={tw`text-xs font-bold text-gray-700 dark:text-gray-200`}>{label}</Text>
        </TouchableOpacity>
    );

    const renderModalFields = () => {
        if (activeMainTab === 'ACCESS') {
            return (
                <View>
                    {/* Role Name */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>ROLE NAME</Text>
                        <TextInput
                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-10`}
                            placeholder="e.g. HR Manager"
                            placeholderTextColor="#94a3b8"
                            value={addName}
                            onChangeText={setAddName}
                        />
                    </View>

                    {/* Module Access Grid */}
                    <View style={tw`mb-5`}>
                        <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3`}>MODULE ACCESS</Text>
                        
                        <View style={tw`flex-row flex-wrap justify-between gap-y-2`}>
                            {modulesList.map((m) => {
                                const isChecked = selectedModules.includes(m.key);
                                return (
                                    <TouchableOpacity
                                        key={m.key}
                                        onPress={() => toggleModuleSelection(m.key)}
                                        style={tw`flex-row items-center px-3 py-2.5 bg-[#f5f3ff] dark:bg-white/2 border ${isChecked ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-gray-200 dark:border-white/5'} rounded-xl w-[48%]`}
                                    >
                                        <View style={tw`w-4 h-4 rounded border ${isChecked ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'border-gray-300 dark:border-white/10'} items-center justify-center mr-2`}>
                                            {isChecked && <Text style={tw`text-[9px] text-white font-bold`}>✓</Text>}
                                        </View>
                                        <Text style={tw`text-xs font-bold ${isChecked ? 'text-[#8b5cf6]' : 'text-gray-600 dark:text-gray-300'}`}>{m.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Granular Permissions list */}
                    {permissions.length > 0 && (
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3`}>GRANULAR PERMISSIONS</Text>
                            
                            {permissions.map((p) => {
                                const isChecked = selectedPermissions.includes(p.id);
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => togglePermissionSelection(p.id)}
                                        style={tw`flex-row items-center py-2.5 border-b border-gray-100 dark:border-white/2`}
                                    >
                                        <View style={tw`w-4.5 h-4.5 rounded border ${isChecked ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'border-gray-300 dark:border-white/10'} items-center justify-center mr-3`}>
                                            {isChecked && <Text style={tw`text-[9px] text-white font-bold`}>✓</Text>}
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{p.name}</Text>
                                            {p.description ? (
                                                <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>{p.description}</Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            );
        }

        if (activeMainTab === 'ORG') {
            if (activeSubTab === 'Locations') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Location Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. Mumbai HQ"
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Address *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. 5th Floor, Building A"
                                placeholderTextColor="#94a3b8"
                                value={addAddress}
                                onChangeText={setAddAddress}
                            />
                        </View>
                        <View style={tw`flex-row gap-3 mb-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>City *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    placeholder="e.g. Mumbai"
                                    placeholderTextColor="#94a3b8"
                                    value={addCity}
                                    onChangeText={setAddCity}
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>State *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    placeholder="e.g. Maharashtra"
                                    placeholderTextColor="#94a3b8"
                                    value={addState}
                                    onChangeText={setAddState}
                                />
                            </View>
                        </View>
                        <View style={tw`flex-row gap-3 mb-4`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Country *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    placeholder="e.g. India"
                                    placeholderTextColor="#94a3b8"
                                    value={addCountry}
                                    onChangeText={setAddCountry}
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Pincode *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    placeholder="e.g. 400001"
                                    placeholderTextColor="#94a3b8"
                                    value={addPincode}
                                    onChangeText={setAddPincode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>
                );
            }
            if (activeSubTab === 'Departments' || activeSubTab === 'Designations') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder={activeSubTab === 'Departments' ? "e.g. Engineering" : "e.g. Lead Engineer"}
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Description</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="Provide brief detail..."
                                placeholderTextColor="#94a3b8"
                                value={addDescription}
                                onChangeText={setAddDescription}
                            />
                        </View>
                    </View>
                );
            }
        }
        if (activeMainTab === 'PAYROLL') {
            if (activeSubTab === 'Salary Components') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Component Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. Basic Pay"
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>

                        <View style={tw`flex-row gap-3 mb-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Type *</Text>
                                <View style={tw`flex-row bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl p-0.5`}>
                                    {['Earning', 'Deduction'].map((t) => {
                                        const isSel = (addType || 'Earning') === t;
                                        return (
                                            <TouchableOpacity
                                                key={t}
                                                onPress={() => setAddType(t)}
                                                style={tw`flex-1 py-1.5 items-center rounded-lg ${isSel ? 'bg-white dark:bg-[#8b5cf6] shadow-sm' : ''}`}
                                            >
                                                <Text style={tw`text-[10px] font-bold ${isSel ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400'}`}>{t}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Taxability *</Text>
                                <View style={tw`flex-row bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl p-0.5`}>
                                    {['Taxable', 'Non-Taxable'].map((t) => {
                                        const isSel = compTaxability === t;
                                        return (
                                            <TouchableOpacity
                                                key={t}
                                                onPress={() => setCompTaxability(t)}
                                                style={tw`flex-1 py-1.5 items-center rounded-lg ${isSel ? 'bg-white dark:bg-[#8b5cf6] shadow-sm' : ''}`}
                                            >
                                                <Text style={tw`text-[10px] font-bold ${isSel ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400'}`}>{t}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        <View style={tw`flex-row gap-3 mb-4`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Calculation *</Text>
                                <View style={tw`flex-row bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl p-0.5`}>
                                    {['Flat Amount', 'Percentage'].map((t) => {
                                        const isSel = compCalculation === t;
                                        return (
                                            <TouchableOpacity
                                                key={t}
                                                onPress={() => setCompCalculation(t)}
                                                style={tw`flex-1 py-1.5 items-center rounded-lg ${isSel ? 'bg-white dark:bg-[#8b5cf6] shadow-sm' : ''}`}
                                            >
                                                <Text style={tw`text-[10px] font-bold ${isSel ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400'}`}>{t}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Value *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-[34px]`}
                                    value={compValue}
                                    onChangeText={setCompValue}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={tw`mb-4`}>
                            {renderCheckbox('Is Basic Pay (Wage Code)', isBasicPay, setIsBasicPay)}
                            {renderCheckbox('Part of PF Wages', partOfPf, setPartOfPf)}
                            {renderCheckbox('FBP Eligible', fbpEligible, setFbpEligible)}
                        </View>
                    </View>
                );
            }
            if (activeSubTab === 'Professional Tax') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>State Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. Maharashtra"
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>

                        <View style={tw`flex-row gap-3 mb-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Min Salary Threshold *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    value={addInTime}
                                    placeholder="e.g. 10000"
                                    placeholderTextColor="#94a3b8"
                                    onChangeText={setAddInTime}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Max Salary Threshold *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                    value={addOutTime}
                                    placeholder="e.g. 15000"
                                    placeholderTextColor="#94a3b8"
                                    onChangeText={setAddOutTime}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Tax Amount *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                value={addGracePeriod}
                                placeholder="e.g. 200"
                                placeholderTextColor="#94a3b8"
                                onChangeText={setAddGracePeriod}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                );
            }
        }
        if (activeMainTab === 'SHIFTS') {
            if (activeSubTab === 'Shifts & Rosters') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Shift Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. morning"
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>
                        <View style={tw`flex-row gap-3 mb-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>In Time (HH:mm) *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                    value={addInTime}
                                    onChangeText={setAddInTime}
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Out Time (HH:mm) *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold`}
                                    value={addOutTime}
                                    onChangeText={setAddOutTime}
                                />
                            </View>
                        </View>
                        <View style={tw`flex-row gap-3 mb-4`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Break Duration (mins)</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-[34px]`}
                                    value={addBreakDuration}
                                    onChangeText={setAddBreakDuration}
                                    keyboardType="number-pad"
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Grace Period (mins)</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-[34px]`}
                                    value={addGracePeriod}
                                    onChangeText={setAddGracePeriod}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                        <View style={tw`mb-4`}>
                            {renderCheckbox('Is Night Shift', addIsNightShift, setAddIsNightShift)}
                        </View>
                    </View>
                );
            }
            if (activeSubTab === 'Holidays') {
                return (
                    <View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Holiday Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                placeholder="e.g. Independence Day"
                                placeholderTextColor="#94a3b8"
                                value={addName}
                                onChangeText={setAddName}
                            />
                        </View>
                        <View style={tw`mb-3`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Date (YYYY-MM-DD) *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}
                                value={addDate}
                                onChangeText={setAddDate}
                            />
                        </View>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>Type *</Text>
                            <View style={tw`flex-row gap-3`}>
                                {['PUBLIC', 'OPTIONAL'].map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setAddType(t)}
                                        style={tw`flex-1 py-2 rounded-xl border items-center ${addType === t || (!addType && t === 'PUBLIC') ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-gray-200 dark:border-white/10 bg-transparent'}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${addType === t || (!addType && t === 'PUBLIC') ? 'text-[#8b5cf6]' : 'text-gray-400'}`}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );
            }
        }
        if (activeMainTab === 'CUSTOM') {
            const isPersonal = addCategory === 'PERSONAL_DETAILS';
            const typeOptions = isPersonal 
                ? [
                    { key: 'TEXT', label: 'Text' },
                    { key: 'NUMBER', label: 'Number' },
                    { key: 'EMAIL', label: 'Email' },
                    { key: 'PASSWORD', label: 'Password' },
                    { key: 'RADIO', label: 'Radio Button' },
                    { key: 'FILE', label: 'File Upload' }
                  ]
                : [
                    { key: 'PDF', label: 'PDF Document' },
                    { key: 'IMAGE', label: 'Image' }
                  ];

            return (
                <View>
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>FIELD NAME *</Text>
                        <TextInput
                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-10`}
                            placeholder="Enter field name (e.g. Alternate Phone, Emergency Contact)"
                            placeholderTextColor="#94a3b8"
                            value={addName}
                            onChangeText={setAddName}
                        />
                    </View>
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>CATEGORY *</Text>
                        <View style={tw`flex-row gap-3`}>
                            {[
                                { key: 'PERSONAL_DETAILS', label: 'Personal Details' },
                                { key: 'DOCUMENT_VAULT', label: 'Document Vault' }
                            ].map((c) => (
                                <TouchableOpacity
                                    key={c.key}
                                    onPress={() => {
                                        setAddCategory(c.key);
                                        setAddType(c.key === 'PERSONAL_DETAILS' ? 'TEXT' : 'PDF');
                                    }}
                                    style={tw`flex-1 py-2 rounded-xl border items-center ${addCategory === c.key ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-gray-200 dark:border-white/10 bg-transparent'}`}
                                >
                                    <Text style={tw`text-xs font-bold ${addCategory === c.key ? 'text-[#8b5cf6]' : 'text-gray-400'}`}>{c.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>FIELD TYPE *</Text>
                        <View style={tw`flex-row flex-wrap justify-between gap-y-2`}>
                            {typeOptions.map((t) => {
                                const isSel = addType === t.key;
                                return (
                                    <TouchableOpacity
                                        key={t.key}
                                        onPress={() => setAddType(t.key)}
                                        style={tw`px-3 py-2 rounded-xl border items-center ${isSel ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-gray-200 dark:border-white/5'} w-[48%]`}
                                    >
                                        <Text style={tw`text-xs font-bold ${isSel ? 'text-[#8b5cf6]' : 'text-gray-500'}`}>{t.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    {addType === 'RADIO' && (
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 mb-1.5`}>OPTIONS (comma separated)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-10`}
                                placeholder="e.g. Yes, No, Maybe"
                                placeholderTextColor="#94a3b8"
                                value={addOptions}
                                onChangeText={setAddOptions}
                            />
                        </View>
                    )}
                </View>
            );
        }
        return null;
    };

    const subTabs = getSubTabs();

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Masters Configuration" subtitle="Manage organization structure, payroll rules, and system settings." />

            {/* Main Tabs Selection Row */}
            <View style={tw`bg-white dark:bg-[#0B0A1F] border-b border-gray-200 dark:border-white/5`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row px-4`}>
                    {mainTabs.map((tab) => {
                        const isSel = activeMainTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => {
                                    setActiveMainTab(tab.key as any);
                                    if (tab.key === 'ORG') setActiveSubTab('Company');
                                    else if (tab.key === 'PAYROLL') setActiveSubTab('Salary Components');
                                    else if (tab.key === 'SHIFTS') setActiveSubTab('Shifts & Rosters');
                                    else if (tab.key === 'CUSTOM') setActiveSubTab('Personal Details');
                                    else setActiveSubTab('');
                                }}
                                style={tw`py-3.5 px-4 mr-2 border-b-2 ${isSel ? 'border-[#8b5cf6]' : 'border-transparent'}`}
                            >
                                <Text style={tw`text-xs font-black ${isSel ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400 dark:text-gray-400'}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Sub Tabs Selection Row */}
            {subTabs.length > 0 && (
                <View style={tw`bg-white dark:bg-[#0B0A1F] border-b border-gray-200 dark:border-white/5 py-2.5 px-4`}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
                        {subTabs.map((sub, idx) => {
                            const isActiveSub = activeSubTab === sub;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setActiveSubTab(sub)}
                                    style={tw`px-4 py-1.5 rounded-xl mr-2.5 border ${isActiveSub ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-transparent bg-transparent'}`}
                                >
                                    <Text style={tw`text-[11px] font-bold ${isActiveSub ? 'text-[#8b5cf6] dark:text-[#c4b5fd]' : 'text-gray-500 dark:text-gray-400'}`}>{sub}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Content view */}
            {activeMainTab === 'ORG' && activeSubTab === 'Company' ? (
                renderCompanyForm()
            ) : activeMainTab === 'ORG' && activeSubTab === 'Signature' ? (
                renderSignatureTab()
            ) : activeMainTab === 'PAYROLL' && activeSubTab === 'Compliance Settings' ? (
                renderComplianceForm()
            ) : activeMainTab === 'SHIFTS' && activeSubTab === 'Attendance Rules' ? (
                renderAttendanceRulesForm()
            ) : activeMainTab === 'SHIFTS' && activeSubTab === 'Sandwich Rule' ? (
                renderSandwichRuleForm()
            ) : (
                <View style={tw`flex-1 p-4`}>
                    {/* Header showing Active SubTab & Add Button */}
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-xs font-black text-gray-900 dark:text-white`}>
                            {activeSubTab || (activeMainTab === 'ACCESS' ? 'Roles' : 'Custom Onboarding Fields')}
                        </Text>
                        {shouldShowAddButton() && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (activeMainTab === 'ACCESS') {
                                        handleCreateRoleClick();
                                    } else {
                                        resetAddForm();
                                        setShowAddModal(true);
                                    }
                                }}
                                style={tw`px-3.5 py-1.5 bg-[#8b5cf6] rounded-xl shadow-sm`}
                            >
                                <Text style={tw`text-[10px] font-black text-white uppercase`}>
                                    + Add {activeSubTab === 'Shifts & Rosters' ? 'Shift' : activeSubTab === 'Holidays' ? 'Holiday' : activeMainTab === 'ACCESS' ? 'Role' : 'New'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={tw`flex-1 justify-center`}>
                            <ActivityIndicator size="large" color="#8b5cf6" />
                        </View>
                    ) : activeMainTab === 'CUSTOM' ? (
                        <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm`}>
                            {renderCustomFieldsHeader()}
                            {dataList.length === 0 ? (
                                <Text style={tw`text-center text-xs font-bold text-gray-400 py-12`}>No custom fields configured.</Text>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false} style={tw`max-h-120`}>
                                    {dataList.map((item, index) => {
                                        const catLabel = item.category === 'PERSONAL_DETAILS' ? 'Personal Details' : 'Document Vault';
                                        const typeLabel = item.type === 'RADIO' ? 'Radio Button' : item.type === 'FILE' ? 'File Upload' : item.type === 'PDF' ? 'PDF Document' : item.type;
                                        const isLast = index === dataList.length - 1;
                                        return (
                                            <View key={index} style={tw`flex-row py-3.5 px-4 border-b ${isLast ? 'border-transparent' : 'border-gray-100 dark:border-white/5'} items-center`}>
                                                <Text style={tw`flex-1 text-xs font-bold text-gray-900 dark:text-white`}>{item.name}</Text>
                                                <Text style={tw`flex-1 text-xs text-center text-gray-500 dark:text-gray-300 font-bold`}>{catLabel}</Text>
                                                <Text style={tw`flex-1 text-xs text-center text-purple-600 dark:text-purple-300 font-bold`}>{typeLabel}</Text>
                                                <View style={tw`w-12 items-end`}>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteCustomField(item.id, item.name)}
                                                        style={tw`p-1.5 bg-red-50 dark:bg-red-500/5 rounded-lg`}
                                                    >
                                                        <Trash2 size={12} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={dataList}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderDetailItem}
                            ListHeaderComponent={
                                activeSubTab === 'Professional Tax' 
                                    ? renderProfessionalTaxHeader() 
                                    : (activeSubTab === 'Holidays' ? renderHolidaysHeader() : null)
                            }
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={tw`text-center text-xs font-bold text-gray-400 py-12`}>No master records found.</Text>
                            }
                        />
                    )}
                </View>
            )}

            {/* Add Master Item Modal */}
            <Modal
                visible={showAddModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={tw`flex-1 justify-center items-center bg-black/60 p-4`}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={tw`w-full max-w-sm`}
                        >
                            <View style={tw`bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-h-[85%]`}>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={tw`pb-2`}>
                                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>
                                        {activeMainTab === 'ACCESS' 
                                            ? (editingRole ? 'Edit Role' : 'Create Role') 
                                            : `Add ${activeSubTab === 'Shifts & Rosters' ? 'Shift' : activeSubTab === 'Holidays' ? 'Holiday' : (activeSubTab || 'Custom Field')}`
                                        }
                                    </Text>

                                    {renderModalFields()}

                                    <View style={tw`flex-row gap-4 mt-2 mb-4`}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowAddModal(false);
                                                resetAddForm();
                                            }}
                                            style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#111827] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleAddSubmit}
                                            disabled={submittingAdd}
                                            style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-white font-bold`}>
                                                {submittingAdd ? 'Saving...' : (activeMainTab === 'ACCESS' ? 'Save Changes' : 'Add Record')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Custom Styled Delete Confirmation Modal for Custom Fields (Web-aligned) */}
            <Modal
                visible={!!fieldToDelete}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFieldToDelete(null)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black/70 px-6`}>
                    <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/10 text-center relative overflow-hidden`}>
                        {/* Top red stripe */}
                        <View style={tw`absolute top-0 left-0 right-0 h-1.5 bg-red-500`} />

                        {/* Trash icon circle with red glow */}
                        <View style={tw`w-18 h-18 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 mt-2`}>
                            <Trash2 size={32} color="#ef4444" />
                        </View>

                        {/* Title */}
                        <Text style={tw`text-xl font-bold text-gray-800 dark:text-white mb-2`}>
                            Delete Custom Field?
                        </Text>

                        {/* Body */}
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed`}>
                            Are you sure you want to delete <Text style={tw`font-bold text-gray-700 dark:text-gray-200`}>{fieldToDelete?.name}</Text>? This action will permanently delete the custom field and all values filled by employees.
                        </Text>

                        {/* Action buttons */}
                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity
                                onPress={() => setFieldToDelete(null)}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl items-center justify-center`}
                            >
                                <Text style={tw`text-xs font-bold text-gray-700 dark:text-gray-300`}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (!fieldToDelete) return;
                                    const id = fieldToDelete.id;
                                    const name = fieldToDelete.name;
                                    setFieldToDelete(null);
                                    try {
                                        await api.delete(`/custom-fields/masters/${id}`);
                                        showToast('Custom field deleted successfully.', 'success');
                                        fetchCustomFieldsList();
                                    } catch (e) {
                                        showToast('Failed to delete custom field.', 'error');
                                    }
                                }}
                                style={tw`flex-1 py-3.5 bg-red-500 rounded-2xl items-center justify-center shadow-lg shadow-red-500/20`}
                            >
                                <Text style={tw`text-xs font-bold text-white`}>
                                    Yes, Delete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
