import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { ArrowLeft, ChevronRight, User, CreditCard, Briefcase, FileText, Calendar, Trash2, Upload } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';
import tw from 'twrnc';
import { useToast } from '../context/ToastContext';

export default function AddEmployeeScreen({ navigation }: any) {
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [masters, setMasters] = useState({
        departments: [] as any[],
        roles: [] as any[],
        designations: [] as any[]
    });

    // Custom Fields Configuration & User Entries
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
    const [selectedFiles, setSelectedFiles] = useState<Record<string, any>>({});
    const [documents, setDocuments] = useState<Record<string, any>>({
        aadhaar: null,
        pan: null,
        degree: null,
    });
    const [salaryComponents, setSalaryComponents] = useState<any[]>([]);
    const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<{ key: string; isCustom: boolean } | null>(null);

    // Dropdown Select State
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [showJoiningPicker, setShowJoiningPicker] = useState(false);

    useEffect(() => {
        const fetchMastersAndCustomFields = async () => {
            try {
                const [deptRes, roleRes, desigRes, customRes, salaryCompRes] = await Promise.all([
                    api.get('/masters/departments'),
                    api.get('/masters/roles'),
                    api.get('/masters/designations'),
                    api.get('/custom-fields/masters'),
                    api.get('/masters/salary-components')
                ]);

                setMasters({
                    departments: deptRes.data || [],
                    roles: roleRes.data || [],
                    designations: desigRes.data || []
                });
                setCustomFields(Array.isArray(customRes.data) ? customRes.data : []);
                setSalaryComponents(salaryCompRes.data || []);
            } catch (error) {
                console.error('Error fetching masters and custom fields:', error);
            }
        };
        fetchMastersAndCustomFields();
    }, []);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bloodGroup: '',
        address: '',
        dob: '',
        departmentId: '',
        roleId: '',
        designationId: '',
        pan: '',
        aadhaar: '',
        uan: '',
        esic: '',
        bankName: '',
        ifsc: '',
        accountNumber: '',
        basicSalary: '',
        selectedSalaryComponents: [] as any[],
        joiningDate: new Date().toISOString().split('T')[0]
    });

    const [errors, setErrors] = useState<any>({});

    const isDuplicateFile = (name: string, size?: number, currentKey?: string) => {
        // Check standard documents
        const standardDuplicate = Object.entries(documents).some(([key, val]) => {
            if (key !== currentKey && val) {
                return val.name === name && (size === undefined || val.size === size);
            }
            return false;
        });
        if (standardDuplicate) return true;

        // Check custom field files
        const customDuplicate = Object.entries(selectedFiles).some(([key, val]) => {
            const mappedKey = `custom-file-${currentKey}`;
            if (key !== mappedKey && val) {
                return val.name === name && (size === undefined || val.size === size);
            }
            return false;
        });
        return customDuplicate;
    };

    const handlePickCustomFile = async (fieldId: string, cfType?: string) => {
        try {
            let pickerType: string | string[] = ['application/pdf', 'image/*'];
            if (cfType?.toUpperCase() === 'PDF' || cfType?.toUpperCase() === 'PDF_DOCUMENT') {
                pickerType = 'application/pdf';
            } else if (cfType?.toUpperCase() === 'IMAGE') {
                pickerType = 'image/*';
            }

            const res = await DocumentPicker.getDocumentAsync({
                type: pickerType,
                copyToCacheDirectory: true
            });

            if (res.canceled) return;

            const asset = res.assets[0];
            if (isDuplicateFile(asset.name || 'document.pdf', asset.size, fieldId)) {
                showToast("This file has already been uploaded. Please select a unique document.", 'error');
                return;
            }

            const fileObj = {
                uri: asset.uri,
                name: asset.name || 'document.pdf',
                type: asset.mimeType || 'application/pdf',
                size: asset.size
            };

            setSelectedFiles(prev => ({
                ...prev,
                [`custom-file-${fieldId}`]: fileObj
            }));

            setCustomFieldValues(prev => ({
                ...prev,
                [fieldId]: asset.name || 'Selected File'
            }));

            // Clear validation error when a file is chosen
            setErrors((prev: any) => ({
                ...prev,
                [`customField-${fieldId}`]: ''
            }));
        } catch (error) {
            console.error('Failed to pick custom field file:', error);
            showToast('Failed to select file.', 'error');
        }
    };

    const renderCustomFieldInput = (cf: any) => {
        const fieldId = String(cf.id);
        const value = customFieldValues[fieldId] || '';
        const hasError = !!errors[`customField-${fieldId}`];

        // File-like custom uploads
        if (['FILE', 'PDF', 'IMAGE', 'FILE_UPLOAD', 'PDF_DOCUMENT'].includes(cf.type?.toUpperCase())) {
            const hasFile = !!selectedFiles[`custom-file-${fieldId}`];
            return (
                <View key={cf.id} style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{cf.name}</Text>
                    <View style={tw`w-full flex-row bg-[#2d1266] border ${hasError ? 'border-red-500' : 'border-[#8b5cf6]/30'} rounded-xl overflow-hidden items-center justify-between`}>
                        <Text style={tw`flex-1 text-xs font-bold text-gray-300 px-4 truncate`} numberOfLines={1}>
                            {hasFile ? selectedFiles[`custom-file-${fieldId}`].name : 'No file chosen'}
                        </Text>
                        {hasFile ? (
                            <TouchableOpacity
                                onPress={() => setConfirmDeleteDoc({ key: fieldId, isCustom: true })}
                                style={tw`px-4 py-3 bg-red-500/10 items-center justify-center`}
                            >
                                <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => handlePickCustomFile(fieldId, cf.type)}
                                style={tw`px-4 py-3 bg-[#8b5cf6]`}
                            >
                                <Text style={tw`text-xs font-black text-white uppercase`}>Choose File</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {hasError ? <Text style={tw`text-[10px] text-red-500 mt-1`}>{errors[`customField-${fieldId}`]}</Text> : null}
                </View>
            );
        }

        // Radio list layout (web-style radio buttons)
        if (cf.type?.toUpperCase() === 'RADIO' || cf.type?.toUpperCase() === 'RADIO_BUTTON') {
            const options = cf.options ? cf.options.split(',') : ['Yes', 'No'];
            return (
                <View key={cf.id} style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{cf.name}</Text>
                    <View style={tw`flex-row flex-wrap gap-x-6 gap-y-2 mt-1.5`}>
                        {options.map((opt: string) => {
                            const trimmedOpt = opt.trim();
                            const isSelected = value === trimmedOpt;
                            return (
                                <TouchableOpacity
                                    key={trimmedOpt}
                                    onPress={() => {
                                        setCustomFieldValues(prev => ({ ...prev, [fieldId]: trimmedOpt }));
                                        setErrors((prev: any) => ({ ...prev, [`customField-${fieldId}`]: '' }));
                                    }}
                                    style={tw`flex-row items-center`}
                                >
                                    <View style={tw`w-4.5 h-4.5 rounded-full border-2 ${isSelected ? 'border-[#8b5cf6] items-center justify-center' : 'border-gray-500'} mr-2`}>
                                        {isSelected && <View style={tw`w-2 h-2 rounded-full bg-[#8b5cf6]`} />}
                                    </View>
                                    <Text style={tw`text-xs font-bold text-white`}>{trimmedOpt}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {hasError ? <Text style={tw`text-[10px] text-red-500 mt-1.5`}>{errors[`customField-${fieldId}`]}</Text> : null}
                </View>
            );
        }

        // Standard inputs
        const keyboardType = cf.type?.toUpperCase() === 'NUMBER' ? 'numeric' : 'default';
        const secureTextEntry = cf.type?.toUpperCase() === 'PASSWORD';

        return (
            <View key={cf.id} style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{cf.name}</Text>
                <TextInput
                    style={tw`w-full px-4 py-2.5 bg-[#2d1266] border ${hasError ? 'border-red-500' : 'border-[#8b5cf6]/30'} rounded-xl text-white font-bold h-11 text-xs`}
                    placeholder={`Enter ${cf.name.toLowerCase()}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    value={value}
                    onChangeText={(text) => {
                        setCustomFieldValues(prev => ({ ...prev, [fieldId]: text }));
                        setErrors((prev: any) => ({ ...prev, [`customField-${fieldId}`]: '' }));
                    }}
                />
                {hasError ? <Text style={tw`text-[10px] text-red-500 mt-1`}>{errors[`customField-${fieldId}`]}</Text> : null}
            </View>
        );
    };

    const handleNext = () => {
        const newErrors: any = {};

        if (currentStep === 1) {
            if (!formData.firstName) newErrors.firstName = 'First name is required';
            if (!formData.lastName) newErrors.lastName = 'Last name is required';
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Invalid email address';
            }
            if (!formData.phone) {
                newErrors.phone = 'Phone number is required';
            } else if (!/^\d{10}$/.test(formData.phone)) {
                newErrors.phone = 'Phone must be 10 digits';
            }
            if (!formData.departmentId) newErrors.departmentId = 'Department is required';
            if (!formData.roleId) newErrors.roleId = 'Role is required';
            if (!formData.designationId) newErrors.designationId = 'Designation is required';
            if (!formData.dob) newErrors.dob = 'DOB is required';
            if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
            if (!formData.address) newErrors.address = 'Residential address is required';

            // Validation for PERSONAL_DETAILS custom fields
            customFields.filter(cf => cf.category === 'PERSONAL_DETAILS').forEach(cf => {
                const fieldId = String(cf.id);
                const value = customFieldValues[fieldId];
                const file = selectedFiles[`custom-file-${fieldId}`];

                if (['FILE', 'PDF', 'IMAGE', 'FILE_UPLOAD', 'PDF_DOCUMENT'].includes(cf.type?.toUpperCase())) {
                    if (!file) {
                        newErrors[`customField-${fieldId}`] = 'Please upload a file';
                    }
                } else {
                    if (!value || !value.trim()) {
                        newErrors[`customField-${fieldId}`] = `${cf.name} is required`;
                    } else if (cf.name.toLowerCase().includes('name')) {
                        if (!/^[A-Za-z\s]+$/.test(value)) {
                            newErrors[`customField-${fieldId}`] = 'Only letters and spaces are allowed';
                        }
                    } else if (cf.type?.toUpperCase() === 'NUMBER') {
                        if (!/^\d+$/.test(value)) {
                            newErrors[`customField-${fieldId}`] = 'Only digits are allowed';
                        } else if (value.length > 10) {
                            newErrors[`customField-${fieldId}`] = 'Number must be up to 10 digits';
                        }
                    } else if (cf.type?.toUpperCase() === 'EMAIL') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            newErrors[`customField-${fieldId}`] = 'Please enter a valid email address';
                        }
                    }
                }
            });

            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!formData.pan) {
                newErrors.pan = 'PAN is required';
            } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
                newErrors.pan = 'Invalid PAN format';
            }
            if (!formData.aadhaar) {
                newErrors.aadhaar = 'Aadhaar is required';
            } else if (!/^\d{12}$/.test(formData.aadhaar)) {
                newErrors.aadhaar = 'Aadhaar must be 12 digits';
            }
            if (!formData.uan) {
                newErrors.uan = 'UAN is required';
            } else if (!/^\d{12}$/.test(formData.uan)) {
                newErrors.uan = 'UAN must be 12 digits';
            }
            if (!formData.esic) {
                newErrors.esic = 'ESIC is required';
            } else if (!/^\d{10}$/.test(formData.esic)) {
                newErrors.esic = 'ESIC must be 10 digits';
            }
            if (!formData.bankName) newErrors.bankName = 'Bank name is required';
            if (!formData.ifsc) newErrors.ifsc = 'IFSC is required';
            if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';

            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

            setCurrentStep(3);
        } else if (currentStep === 3) {
            if (!formData.basicSalary) {
                newErrors.basicSalary = 'Basic salary is required';
            }
            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

            setCurrentStep(4);
        } else if (currentStep === 4) {
            // Validation for standard documents
            if (!documents.aadhaar || !documents.pan || !documents.degree) {
                showToast("Please upload all required standard documents (Aadhaar Card, PAN Card, and Highest Qualification Degree).", 'error');
                return;
            }

            // Validation for DOCUMENT_VAULT custom fields
            let hasCustomError = false;
            customFields.filter(cf => cf.category === 'DOCUMENT_VAULT').forEach(cf => {
                const fieldId = String(cf.id);
                const file = selectedFiles[`custom-file-${fieldId}`];

                if (!file) {
                    newErrors[`customField-${fieldId}`] = 'Please upload this document';
                    hasCustomError = true;
                }
            });

            if (hasCustomError) {
                setErrors(newErrors);
                return;
            }

            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                roleId: parseInt(formData.roleId),
                departmentId: formData.departmentId,
                designationId: formData.designationId,
                joiningDate: formData.joiningDate,
                pan: formData.pan,
                aadhaar: formData.aadhaar,
                uan: formData.uan,
                esic: formData.esic,
                bankName: formData.bankName,
                ifsc: formData.ifsc,
                accountNumber: formData.accountNumber,
                bloodGroup: formData.bloodGroup,
                dob: formData.dob,
                address: formData.address,
                salary: {
                    basic: formData.basicSalary
                },
                customFieldValues: customFieldValues
            };

            const formDataPayload = new FormData();
            formDataPayload.append('data', JSON.stringify(data));

            // Attach standard documents
            if (documents.aadhaar) {
                if (Platform.OS === 'web') {
                    if (documents.aadhaar.file) {
                        formDataPayload.append('aadhaar', documents.aadhaar.file);
                    } else if (documents.aadhaar.uri) {
                        const blobRes = await fetch(documents.aadhaar.uri);
                        const blob = await blobRes.blob();
                        formDataPayload.append('aadhaar', blob, documents.aadhaar.name || 'aadhaar.pdf');
                    }
                } else {
                    formDataPayload.append('aadhaar', {
                        uri: documents.aadhaar.uri,
                        name: documents.aadhaar.name,
                        type: documents.aadhaar.type
                    } as any);
                }
            }
            if (documents.pan) {
                if (Platform.OS === 'web') {
                    if (documents.pan.file) {
                        formDataPayload.append('pan', documents.pan.file);
                    } else if (documents.pan.uri) {
                        const blobRes = await fetch(documents.pan.uri);
                        const blob = await blobRes.blob();
                        formDataPayload.append('pan', blob, documents.pan.name || 'pan.pdf');
                    }
                } else {
                    formDataPayload.append('pan', {
                        uri: documents.pan.uri,
                        name: documents.pan.name,
                        type: documents.pan.type
                    } as any);
                }
            }
            if (documents.degree) {
                if (Platform.OS === 'web') {
                    if (documents.degree.file) {
                        formDataPayload.append('degree', documents.degree.file);
                    } else if (documents.degree.uri) {
                        const blobRes = await fetch(documents.degree.uri);
                        const blob = await blobRes.blob();
                        formDataPayload.append('degree', blob, documents.degree.name || 'degree.pdf');
                    }
                } else {
                    formDataPayload.append('degree', {
                        uri: documents.degree.uri,
                        name: documents.degree.name,
                        type: documents.degree.type
                    } as any);
                }
            }

            // Attach picked custom field files
            for (const key of Object.keys(selectedFiles)) {
                const file = selectedFiles[key];
                if (file) {
                    if (Platform.OS === 'web') {
                        if (file.file) {
                            formDataPayload.append(key, file.file);
                        } else if (file.uri) {
                            const blobRes = await fetch(file.uri);
                            const blob = await blobRes.blob();
                            formDataPayload.append(key, blob, file.name || 'custom_document.pdf');
                        }
                    } else {
                        formDataPayload.append(key, {
                            uri: file.uri,
                            name: file.name,
                            type: file.type
                        } as any);
                    }
                }
            }

            const response = await api.post('/employee', formDataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Save selected salary components
            const createdEmployee = response.data;
            if (createdEmployee && createdEmployee.id && formData.selectedSalaryComponents.length > 0) {
                const componentsPayload = formData.selectedSalaryComponents.map((c: any) => ({
                    componentId: String(c.id),
                    amount: null
                }));
                await api.put(`/payroll/${createdEmployee.id}/components`, {
                    components: componentsPayload
                });
            }

            showToast("Employee added successfully!", 'success');
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to add employee.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePickStandardFile = async (docKey: string) => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });
            if (res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                if (isDuplicateFile(asset.name || 'document.pdf', asset.size, docKey)) {
                    showToast("This file has already been uploaded. Please select a unique document.", 'error');
                    return;
                }

                const fileData = {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                    size: asset.size
                };
                setDocuments(prev => ({ ...prev, [docKey]: fileData }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const removeStandardFile = (docKey: string) => {
        setDocuments(prev => ({ ...prev, [docKey]: null }));
    };

    const toggleSalaryComponent = (component: any) => {
        const alreadySelected = formData.selectedSalaryComponents.some(
            (item: any) => item.id === component.id
        );
        if (alreadySelected) {
            setFormData(prev => ({
                ...prev,
                selectedSalaryComponents: prev.selectedSalaryComponents.filter(
                    (item: any) => item.id !== component.id
                )
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                selectedSalaryComponents: [
                    ...prev.selectedSalaryComponents,
                    {
                        id: component.id,
                        name: component.name,
                        type: component.type,
                        calculationType: component.calculationType,
                        value: component.value
                    }
                ]
            }));
        }
    };

    const removeSelectedComponent = (componentId: number) => {
        setFormData(prev => ({
            ...prev,
            selectedSalaryComponents: prev.selectedSalaryComponents.filter(
                (item: any) => item.id !== componentId
            )
        }));
    };

    const renderSalaryComponentsSelect = () => {
        const isOpen = openDropdown === 'salaryComponents';
        const selectedNames = formData.selectedSalaryComponents.map((c: any) => c.name).join(', ');

        return (
            <View style={tw`mb-4 z-20`}>
                <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>Select Components</Text>
                <TouchableOpacity
                    onPress={() => setOpenDropdown(isOpen ? null : 'salaryComponents')}
                    style={tw`w-full px-4 py-3 bg-[#2d1266] border border-[#8b5cf6]/30 rounded-xl flex-row justify-between items-center h-11`}
                >
                    <Text style={tw`text-xs font-bold flex-1 text-white`} numberOfLines={1}>
                        {selectedNames || 'Select components'}
                    </Text>
                    <Text style={tw`text-gray-400 text-[10px]`}>{isOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isOpen && (
                    <View style={tw`mt-1.5 w-full bg-[#1e0b40] border border-[#8b5cf6]/30 rounded-xl overflow-hidden shadow-lg z-50`}>
                        <ScrollView style={tw`max-h-48`} keyboardShouldPersistTaps="handled">
                            {salaryComponents.length === 0 ? (
                                <Text style={tw`text-xs text-gray-400 p-4 text-center`}>No salary components found</Text>
                            ) : (
                                salaryComponents.map((component) => {
                                    const isSelected = formData.selectedSalaryComponents.some(
                                        (item: any) => item.id === component.id
                                    );
                                    return (
                                        <TouchableOpacity
                                            key={component.id}
                                            onPress={() => toggleSalaryComponent(component)}
                                            style={tw`flex-row items-center justify-between px-4 py-3 border-b border-[#8b5cf6]/10`}
                                        >
                                            <View style={tw`flex-row items-center flex-1 mr-2`}>
                                                <View style={tw`w-4 h-4 border border-[#8b5cf6] rounded mr-2.5 items-center justify-center bg-black/20`}>
                                                    {isSelected && <Text style={tw`text-[10px] text-[#8b5cf6] font-bold`}>✓</Text>}
                                                </View>
                                                <Text style={tw`text-xs text-white font-bold`}>{component.name}</Text>
                                            </View>
                                            <Text style={tw`text-[8px] px-2 py-0.5 rounded-full font-black ${component.type === 'EARNING' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                                {component.type}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    const renderSelectedComponentsList = () => {
        return (
            <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-black text-[#c4b5fd] mb-3 uppercase tracking-wider`}>Selected Components</Text>
                {formData.selectedSalaryComponents.length === 0 ? (
                    <View style={tw`p-6 bg-black/10 border border-[#8b5cf6]/20 rounded-2xl items-center`}>
                        <Text style={tw`text-xs text-[#c4b5fd] font-bold`}>No components selected</Text>
                        <Text style={tw`text-[10px] text-gray-400 mt-1`}>Select components from dropdown above</Text>
                    </View>
                ) : (
                    <View style={tw`gap-3`}>
                        {formData.selectedSalaryComponents.map((component: any) => (
                            <View
                                key={component.id}
                                style={tw`p-4 bg-black/10 border border-[#8b5cf6]/20 rounded-2xl flex-row justify-between items-center`}
                            >
                                <View style={tw`flex-1 mr-3`}>
                                    <View style={tw`flex-row items-center gap-2 mb-1`}>
                                        <Text style={tw`text-xs font-bold text-white`}>{component.name}</Text>
                                        <Text style={tw`text-[8px] px-2 py-0.5 rounded-full font-black ${component.type === 'EARNING' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {component.type}
                                        </Text>
                                    </View>
                                    <Text style={tw`text-[10px] text-gray-300`}>
                                        Calculation:{" "}
                                        {component.calculationType === "FLAT"
                                            ? `₹${component.value}`
                                            : component.calculationType === "%_BASIC"
                                                ? `${component.value}% of Basic`
                                                : component.calculationType === "%_GROSS"
                                                    ? `${component.value}% of Gross`
                                                    : `${component.value}`}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => removeSelectedComponent(component.id)}
                                    style={tw`p-2 rounded-lg bg-red-500/10`}
                                >
                                    <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderDocumentChecklistItem = (label: string, docKey: string, required: boolean) => {
        const fileObj = documents[docKey];
        const hasFile = !!fileObj;

        return (
            <TouchableOpacity
                key={docKey}
                onPress={() => handlePickStandardFile(docKey)}
                style={tw`flex-row items-center justify-between p-4 bg-black/10 border ${hasFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-[#8b5cf6]/20'} rounded-2xl mb-4`}
            >
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <View style={tw`w-12 h-12 rounded-xl flex items-center justify-center ${hasFile ? 'bg-emerald-500/15 text-emerald-400' : 'bg-black/10 text-gray-400'} mr-4`}>
                        <FileText size={24} color={hasFile ? '#34d399' : '#94a3b8'} />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-bold text-white text-sm`}>
                            {label} {required ? <Text style={tw`text-red-500`}>*</Text> : null}
                        </Text>
                        <Text style={tw`text-xs ${hasFile ? 'text-emerald-400 font-bold' : 'text-gray-400'} mt-1`} numberOfLines={1}>
                            {hasFile ? fileObj.name : 'Click to upload document'}
                        </Text>
                    </View>
                </View>

                <View style={tw`flex-row items-center gap-2`}>
                    {hasFile ? (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteDoc({ key: docKey, isCustom: false });
                            }}
                            style={tw`p-2 bg-red-500/10 rounded-lg`}
                        >
                            <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                    ) : (
                        <View style={tw`p-2 bg-white/5 rounded-lg`}>
                            <Upload size={16} color="#c4b5fd" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderInput = (label: string, field: keyof typeof formData, placeholder: string, keyboardType: any = 'default') => (
        <View style={tw`mb-4`}>
            <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{label}</Text>
            <TextInput
                style={tw`w-full px-4 py-2.5 bg-[#2d1266] border ${errors[field] ? 'border-red-500' : 'border-[#8b5cf6]/30'} rounded-xl text-white font-bold h-11 text-xs`}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                keyboardType={keyboardType}
                value={typeof formData[field] === 'string' ? formData[field] : ''}
                onChangeText={(text) => {
                    setErrors({ ...errors, [field]: '' });
                    setFormData({ ...formData, [field]: text });
                }}
            />
            {errors[field] ? <Text style={tw`text-[10px] text-red-400 mt-1`}>{errors[field]}</Text> : null}
        </View>
    );

    const formatDateToDisplay = (dateString: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD -> DD-MM-YYYY
        }
        return dateString;
    };

    const formatDateToValue = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const renderDateInput = (label: string, field: 'dob' | 'joiningDate', showPicker: boolean, setShowPicker: (show: boolean) => void) => {
        const value = formData[field];
        const displayValue = formatDateToDisplay(value);
        const hasError = !!errors[field];

        return (
            <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{label}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setOpenDropdown(null);
                        setShowPicker(true);
                    }}
                    style={tw`w-full px-4 py-3 bg-[#2d1266] border ${hasError ? 'border-red-500' : 'border-[#8b5cf6]/30'} rounded-xl flex-row justify-between items-center h-11`}
                >
                    <Text style={tw`text-xs font-bold ${displayValue ? 'text-white' : 'text-gray-400'}`}>
                        {displayValue || 'dd-mm-yyyy'}
                    </Text>
                    <Calendar size={16} color="#94a3b8" />
                </TouchableOpacity>
                {hasError ? <Text style={tw`text-[10px] text-red-400 mt-1`}>{errors[field]}</Text> : null}

                {showPicker && (
                    <DateTimePicker
                        value={value ? new Date(value) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowPicker(false);
                            if (selectedDate) {
                                const formatted = formatDateToValue(selectedDate);
                                setErrors({ ...errors, [field]: '' });
                                setFormData({ ...formData, [field]: formatted });
                            }
                        }}
                    />
                )}
            </View>
        );
    };

    const renderSelect = (label: string, field: keyof typeof formData, valueLabel: string, options: { label: string; value: any }[]) => {
        const isOpen = openDropdown === field;
        return (
            <View style={tw`mb-4 z-20`}>
                <Text style={tw`text-xs font-bold text-[#c4b5fd] mb-1.5 uppercase`}>{label}</Text>
                <TouchableOpacity
                    onPress={() => setOpenDropdown(isOpen ? null : field)}
                    style={tw`w-full px-4 py-3 bg-[#2d1266] border ${errors[field] ? 'border-red-500' : 'border-[#8b5cf6]/30'} rounded-xl flex-row justify-between items-center h-11`}
                >
                    <Text style={tw`text-xs font-bold ${valueLabel ? 'text-white' : 'text-gray-400'}`}>
                        {valueLabel || `Select ${label.replace(' *', '')}`}
                    </Text>
                    <Text style={tw`text-gray-400 text-[10px]`}>{isOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isOpen && (
                    <View style={tw`mt-1.5 w-full bg-[#1e0b40] border border-[#8b5cf6]/30 rounded-xl overflow-hidden shadow-lg z-50`}>
                        <ScrollView style={tw`max-h-40`} keyboardShouldPersistTaps="handled">
                            {options.map((opt) => {
                                const isSelected = formData[field] === String(opt.value);
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => {
                                            setFormData(prev => ({ ...prev, [field]: String(opt.value) }));
                                            setErrors((prev: any) => ({ ...prev, [field]: '' }));
                                            setOpenDropdown(null);
                                        }}
                                        style={tw`px-4 py-3 border-b border-gray-800 flex-row justify-between items-center ${isSelected ? 'bg-[#8b5cf6]/10' : ''}`}
                                    >
                                        <Text style={tw`text-xs font-bold ${isSelected ? 'text-[#8b5cf6]' : 'text-white'}`}>{opt.label}</Text>
                                        {isSelected && <Text style={tw`text-[#8b5cf6] text-[10px]`}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
                {errors[field] ? <Text style={tw`text-[10px] text-red-500 mt-1`}>{errors[field]}</Text> : null}
            </View>
        );
    };

    const personalCustomFields = customFields.filter(cf => cf.category === 'PERSONAL_DETAILS');
    const documentCustomFields = customFields.filter(cf => cf.category === 'DOCUMENT_VAULT');

    const activeDept = masters.departments.find(d => String(d.id) === formData.departmentId);
    const activeRole = masters.roles.find(r => String(r.id) === formData.roleId);
    const activeDesig = masters.designations.find(d => String(d.id) === formData.designationId);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-[#0b0a1f]`}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[
                tw`flex-1 px-4`,
                { paddingTop: insets.top + 16 }
            ]}>

                {/* Header */}
                <View style={tw`flex-row items-center mb-5`}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={tw`text-lg font-bold text-white`}>Add Employee</Text>
                </View>

                {/* Main Form Card - Aligned with Web Design */}
                <View style={tw`flex-1 bg-[#4c1d95] rounded-[2rem] border border-[#8b5cf6]/30 overflow-hidden mb-6 shadow-2xl`}>
                    {/* Card Header Panel */}
                    <View style={tw`p-5 border-b border-[#8b5cf6]/30 bg-black/15`}>
                        <Text style={tw`text-lg font-black text-white mb-1`}>Onboard New Employee</Text>
                        <Text style={tw`text-xs text-[#c4b5fd] mb-6`}>Complete the following steps to add a new team member.</Text>

                        {/* Step indicator */}
                        <View style={tw`flex-row justify-between items-center relative px-2`}>
                            {/* Line behind steps */}
                            <View style={tw`absolute left-8 right-8 top-4.5 h-[1.5px] bg-[#8b5cf6]/30`} />

                            {[
                                { step: 1, label: 'PERSONAL DETAILS', icon: User },
                                { step: 2, label: 'STATUTORY INFO', icon: CreditCard },
                                { step: 3, label: 'SALARY INFO', icon: Briefcase },
                                { step: 4, label: 'DOCUMENTS', icon: FileText }
                            ].map((item) => {
                                const isActive = currentStep === item.step;
                                const isDone = currentStep > item.step;
                                return (
                                    <View key={item.step} style={tw`items-center z-10 flex-1`}>
                                        <View style={tw`w-9 h-9 rounded-full flex items-center justify-center border-2 ${isActive || isDone ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'bg-[#4c1d95] border-[#8b5cf6]/40'}`}>
                                            <item.icon size={16} color={isActive || isDone ? 'white' : '#c4b5fd'} />
                                        </View>
                                        <Text style={tw`text-[7px] font-black tracking-wider text-center mt-2 ${isActive ? 'text-white' : 'text-[#c4b5fd]'}`}>
                                            {item.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Form fields ScrollArea */}
                    <ScrollView
                        style={tw`flex-grow`}
                        contentContainerStyle={tw`p-5`}
                        keyboardShouldPersistTaps="handled"
                    >
                        {currentStep === 1 && (
                            <View>
                                {renderInput('First Name *', 'firstName', 'First')}
                                {renderInput('Last Name *', 'lastName', 'Last')}
                                {renderInput('Email Address *', 'email', 'Enter your email', 'email-address')}
                                {renderInput('Phone Number *', 'phone', '+91', 'phone-pad')}
                                {renderDateInput('Date of Birth *', 'dob', showDobPicker, setShowDobPicker)}
                                {renderDateInput('Date of Joining *', 'joiningDate', showJoiningPicker, setShowJoiningPicker)}

                                {renderSelect('Department *', 'departmentId', activeDept?.name || '',
                                    masters.departments.map(d => ({ label: d.name, value: d.id }))
                                )}

                                {renderSelect('System Role *', 'roleId', activeRole?.name || '',
                                    masters.roles.map(r => ({ label: r.name, value: r.id }))
                                )}

                                {renderSelect('Designation / Title *', 'designationId', activeDesig?.name || '',
                                    masters.designations.map(d => ({ label: d.name, value: d.id }))
                                )}

                                {renderSelect('Blood Group *', 'bloodGroup', formData.bloodGroup,
                                    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ label: bg, value: bg }))
                                )}

                                {renderInput('Residential Address *', 'address', 'Enter full residential address')}

                                {/* Custom Personal Details Configuration */}
                                {personalCustomFields.length > 0 && (
                                    <View style={tw`mt-6 pt-4 border-t border-[#8b5cf6]/30`}>
                                        <Text style={tw`text-xs font-black text-[#c4b5fd] mb-3 uppercase tracking-wider`}>Additional Details</Text>
                                        {personalCustomFields.map(cf => renderCustomFieldInput(cf))}
                                    </View>
                                )}
                            </View>
                        )}

                        {currentStep === 2 && (
                            <View>
                                {renderInput('PAN *', 'pan', 'ABCDE1234F')}
                                {renderInput('Aadhaar *', 'aadhaar', '123456789012', 'numeric')}
                                {renderInput('UAN (PF) *', 'uan', '100123456789', 'numeric')}
                                {renderInput('ESIC Number *', 'esic', '1234567890', 'numeric')}
                                {renderInput('Bank Name *', 'bankName', 'SBI')}
                                {renderInput('IFSC Code *', 'ifsc', 'SBIN0001234')}
                                {renderInput('Account Number *', 'accountNumber', '12345678901', 'numeric')}
                            </View>
                        )}

                        {currentStep === 3 && (
                            <View>
                                {renderInput('Basic Monthly Salary *', 'basicSalary', 'e.g. 45000', 'numeric')}
                                {renderSalaryComponentsSelect()}
                                {renderSelectedComponentsList()}
                            </View>
                        )}

                        {currentStep === 4 && (
                            <View>
                                <Text style={tw`text-xs font-black text-[#c4b5fd] mb-3 uppercase tracking-wider`}>Required Documents Checklist</Text>
                                {renderDocumentChecklistItem('Aadhaar Card', 'aadhaar', true)}
                                {renderDocumentChecklistItem('PAN Card', 'pan', true)}
                                {renderDocumentChecklistItem('Highest Qualification Degree', 'degree', true)}

                                {/* Custom Document Vault Configuration */}
                                {documentCustomFields.length > 0 && (
                                    <View style={tw`mt-6 pt-4 border-t border-[#8b5cf6]/30`}>
                                        <Text style={tw`text-xs font-black text-[#c4b5fd] mb-3 uppercase tracking-wider`}>Additional Custom Documents</Text>
                                        {documentCustomFields.map(cf => renderCustomFieldInput(cf))}
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Actions inside Card */}
                    <View style={tw`p-5 border-t border-[#8b5cf6]/30 bg-black/15 flex-row justify-between`}>
                        {currentStep > 1 ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setOpenDropdown(null);
                                    setCurrentStep(currentStep - 1);
                                }}
                                style={tw`px-6 py-2.5 bg-[#8b5cf6]/20 rounded-full border border-[#8b5cf6]/40`}
                            >
                                <Text style={tw`text-white font-bold text-xs`}>Back</Text>
                            </TouchableOpacity>
                        ) : <View />}

                        <TouchableOpacity
                            onPress={() => {
                                setOpenDropdown(null);
                                handleNext();
                            }}
                            disabled={loading}
                            style={tw`px-8 py-2.5 bg-[#8b5cf6] rounded-full flex-row items-center gap-1.5 shadow-lg shadow-brand-500/20`}
                        >
                            <Text style={tw`text-white font-bold text-xs`}>
                                {loading ? 'Submitting...' : currentStep === 4 ? 'Submit' : 'Next'}
                            </Text>
                            <ChevronRight size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Delete Document Confirmation Modal */}
            <Modal
                visible={!!confirmDeleteDoc}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmDeleteDoc(null)}
            >
                <View style={tw`flex-1 bg-black/60 items-center justify-center p-4`}>
                    <View style={tw`bg-[#1e0b40] border border-[#8b5cf6]/30 rounded-3xl w-full max-w-xs p-5 items-center shadow-2xl`}>
                        {/* Thin top red stripe */}
                        <View style={[tw`absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-3xl`]} />

                        {/* Trash Icon Wrapper */}
                        <View style={tw`w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mt-2`}>
                            <Trash2 size={24} color="#ef4444" />
                        </View>

                        <Text style={tw`text-base font-bold text-white mb-2 text-center`}>Remove Document?</Text>
                        <Text style={tw`text-xs text-gray-300 font-bold mb-6 text-center leading-4`}>
                            Are you sure you want to remove this document? You will need to upload it again if needed.
                        </Text>

                        {/* Action buttons */}
                        <View style={tw`flex-row gap-3 w-full`}>
                            <TouchableOpacity
                                onPress={() => setConfirmDeleteDoc(null)}
                                style={tw`flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl items-center`}
                            >
                                <Text style={tw`text-xs font-bold text-gray-300`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (confirmDeleteDoc) {
                                        if (confirmDeleteDoc.isCustom) {
                                            setSelectedFiles(prev => ({
                                                ...prev,
                                                [`custom-file-${confirmDeleteDoc.key}`]: null
                                            }));
                                            setCustomFieldValues(prev => ({
                                                ...prev,
                                                [confirmDeleteDoc.key]: ''
                                            }));
                                        } else {
                                            setDocuments(prev => ({
                                                ...prev,
                                                [confirmDeleteDoc.key]: null
                                            }));
                                        }
                                        setConfirmDeleteDoc(null);
                                    }
                                }}
                                style={tw`flex-1 py-2.5 bg-red-600 rounded-xl items-center shadow-lg shadow-red-500/20`}
                            >
                                <Text style={tw`text-xs font-bold text-white`}>Yes, Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
