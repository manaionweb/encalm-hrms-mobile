import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronRight, User, CreditCard, Briefcase, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../utils/api';
import tw from 'twrnc';

export default function AddEmployeeScreen({ navigation }: any) {
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

    // Dropdown Select State
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        const fetchMastersAndCustomFields = async () => {
            try {
                const [deptRes, roleRes, desigRes, customRes] = await Promise.all([
                    api.get('/masters/departments'),
                    api.get('/masters/roles'),
                    api.get('/masters/designations'),
                    api.get('/custom-fields/masters')
                ]);

                setMasters({
                    departments: deptRes.data || [],
                    roles: roleRes.data || [],
                    designations: desigRes.data || []
                });
                setCustomFields(Array.isArray(customRes.data) ? customRes.data : []);
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
        joiningDate: new Date().toISOString().split('T')[0]
    });

    const [errors, setErrors] = useState<any>({});

    const handlePickCustomFile = async (fieldId: string) => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });

            if (res.canceled) return;

            const asset = res.assets[0];
            const fileObj = {
                uri: asset.uri,
                name: asset.name || 'document.pdf',
                type: asset.mimeType || 'application/pdf'
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
            Alert.alert('Error', 'Failed to select file.');
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
                    <Text style={tw`text-xs font-bold text-gray-400 mb-1.5 uppercase`}>{cf.name}</Text>
                    <View style={tw`w-full flex-row bg-[#1e1b4b] border ${hasError ? 'border-red-500' : 'border-gray-700'} rounded-xl overflow-hidden items-center justify-between`}>
                        <Text style={tw`flex-1 text-xs font-bold text-gray-400 px-4 truncate`} numberOfLines={1}>
                            {hasFile ? selectedFiles[`custom-file-${fieldId}`].name : 'No file chosen'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handlePickCustomFile(fieldId)}
                            style={tw`px-4 py-3 bg-[#8b5cf6]`}
                        >
                            <Text style={tw`text-xs font-black text-white uppercase`}>Choose File</Text>
                        </TouchableOpacity>
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
                    <Text style={tw`text-xs font-bold text-gray-400 mb-1.5 uppercase`}>{cf.name}</Text>
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
                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5 uppercase`}>{cf.name}</Text>
                <TextInput
                    style={tw`w-full px-4 py-2.5 bg-[#1e1b4b] border ${hasError ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white font-bold h-11 text-xs`}
                    placeholder={`Enter ${cf.name.toLowerCase()}`}
                    placeholderTextColor="#64748b"
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
            // Validation for DOCUMENT_VAULT custom fields
            customFields.filter(cf => cf.category === 'DOCUMENT_VAULT').forEach(cf => {
                const fieldId = String(cf.id);
                const file = selectedFiles[`custom-file-${fieldId}`];

                if (!file) {
                    newErrors[`customField-${fieldId}`] = 'Please upload this document';
                }
            });

            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

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

            // Attach picked files
            Object.keys(selectedFiles).forEach(key => {
                const file = selectedFiles[key];
                formDataPayload.append(key, {
                    uri: file.uri,
                    name: file.name,
                    type: file.type
                } as any);
            });

            await api.post('/employee', formDataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            Alert.alert("Success", "Employee added successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to add employee.");
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label: string, field: keyof typeof formData, placeholder: string, keyboardType: any = 'default') => (
        <View style={tw`mb-4`}>
            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5 uppercase`}>{label}</Text>
            <TextInput
                style={tw`w-full px-4 py-2.5 bg-[#1e1b4b] border ${errors[field] ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white font-bold h-11 text-xs`}
                placeholder={placeholder}
                placeholderTextColor="#64748b"
                keyboardType={keyboardType}
                value={formData[field]}
                onChangeText={(text) => {
                    setErrors({ ...errors, [field]: '' });
                    setFormData({ ...formData, [field]: text });
                }}
            />
            {errors[field] ? <Text style={tw`text-[10px] text-red-500 mt-1`}>{errors[field]}</Text> : null}
        </View>
    );

    const renderSelect = (label: string, field: keyof typeof formData, valueLabel: string, options: { label: string; value: any }[]) => {
        const isOpen = openDropdown === field;
        return (
            <View style={tw`mb-4 z-20`}>
                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5 uppercase`}>{label}</Text>
                <TouchableOpacity
                    onPress={() => setOpenDropdown(isOpen ? null : field)}
                    style={tw`w-full px-4 py-3 bg-[#1e1b4b] border ${errors[field] ? 'border-red-500' : 'border-gray-700'} rounded-xl flex-row justify-between items-center h-11`}
                >
                    <Text style={tw`text-xs font-bold ${valueLabel ? 'text-white' : 'text-gray-400'}`}>
                        {valueLabel || `Select ${label.replace(' *', '')}`}
                    </Text>
                    <Text style={tw`text-gray-450 text-[10px]`}>{isOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isOpen && (
                    <View style={tw`mt-1.5 w-full bg-[#1c1a45] border border-gray-700 rounded-xl overflow-hidden shadow-lg z-50`}>
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
        <View style={[
            tw`flex-1 bg-[#0b0a1f] px-4`,
            { paddingTop: insets.top + 16 }
        ]}>
            
            {/* Header */}
            <View style={tw`flex-row items-center mb-6`}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                    <ArrowLeft size={20} color="white" />
                </TouchableOpacity>
                <Text style={tw`text-lg font-bold text-white`}>Add Employee</Text>
            </View>

            {/* Steps Indicator - Aligned with Web Design */}
            <View style={tw`bg-[#12112b] p-5 rounded-3xl mb-6 border border-white/5`}>
                <View style={tw`flex-row justify-between items-center relative px-2`}>
                    {/* Line behind steps */}
                    <View style={tw`absolute left-8 right-8 top-4.5 h-[1px] bg-gray-700`} />
                    
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
                                <View style={tw`w-9 h-9 rounded-full flex items-center justify-center border-2 ${isActive || isDone ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'bg-[#12112b] border-gray-700'}`}>
                                    <item.icon size={16} color={isActive || isDone ? 'white' : '#64748b'} />
                                </View>
                                <Text style={tw`text-[7px] font-black tracking-wider text-center mt-2 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {item.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <ScrollView style={tw`flex-grow`} keyboardShouldPersistTaps="handled">
                {currentStep === 1 && (
                    <View>
                        {renderInput('First Name *', 'firstName', 'First')}
                        {renderInput('Last Name *', 'lastName', 'Last')}
                        {renderInput('Email Address *', 'email', 'Enter your email', 'email-address')}
                        {renderInput('Phone Number *', 'phone', '+91', 'phone-pad')}
                        {renderInput('Date of Birth *', 'dob', 'dd-mm-yyyy')}
                        {renderInput('Date of Joining *', 'joiningDate', 'yyyy-mm-dd')}
                        
                        {renderSelect('Department *', 'departmentId', activeDept?.name || '', 
                            masters.departments.map(d => ({ label: d.name, value: d.id }))
                        )}

                        {renderSelect('System Role *', 'roleId', activeRole?.name || '', 
                            masters.roles.map(r => ({ label: r.name, value: r.id }))
                        )}

                        {renderSelect('Designation / Title *', 'designationId', activeDesig?.name || '', 
                            masters.designations.map(d => ({ label: d.name, value: d.id }))
                        )}

                        {renderSelect('Blood Group', 'bloodGroup', formData.bloodGroup, 
                            ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ label: bg, value: bg }))
                        )}

                        {renderInput('Residential Address *', 'address', 'Enter full residential address')}

                        {/* Custom Personal Details Configuration */}
                        {personalCustomFields.length > 0 && (
                            <View style={tw`mt-6 pt-4 border-t border-gray-700`}>
                                <Text style={tw`text-xs font-black text-gray-400 mb-3 uppercase tracking-wider`}>Additional Details</Text>
                                {personalCustomFields.map(cf => renderCustomFieldInput(cf))}
                            </View>
                        )}
                    </View>
                )}

                {currentStep === 2 && (
                    <View>
                        {renderInput('PAN *', 'pan', 'ABCDE1234F')}
                        {renderInput('Aadhaar *', 'aadhaar', '123456789012', 'numeric')}
                        {renderInput('UAN (PF)', 'uan', '100123456789', 'numeric')}
                        {renderInput('ESIC Number', 'esic', '1234567890', 'numeric')}
                        {renderInput('Bank Name *', 'bankName', 'SBI')}
                        {renderInput('IFSC Code *', 'ifsc', 'SBIN0001234')}
                        {renderInput('Account Number *', 'accountNumber', '12345678901', 'numeric')}
                    </View>
                )}

                {currentStep === 3 && (
                    <View>
                        {renderInput('Basic Monthly Salary *', 'basicSalary', 'e.g. 45000', 'numeric')}
                    </View>
                )}

                {currentStep === 4 && (
                    <View>
                        <Text style={tw`text-sm font-bold text-white mb-4`}>Upload Documents</Text>
                        
                        {/* Custom Document Vault Configuration */}
                        {documentCustomFields.length > 0 ? (
                            documentCustomFields.map(cf => renderCustomFieldInput(cf))
                        ) : (
                            <Text style={tw`text-xs text-gray-550 italic py-4`}>No document fields configured.</Text>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={tw`py-4 border-t border-gray-800 flex-row justify-between`}>
                {currentStep > 1 ? (
                    <TouchableOpacity
                        onPress={
                            () => {
                                setOpenDropdown(null);
                                setCurrentStep(currentStep - 1);
                            }
                        }
                        style={tw`px-6 py-3 bg-[#1e1b4b] rounded-full`}
                    >
                        <Text style={tw`text-gray-300 font-bold`}>Back</Text>
                    </TouchableOpacity>
                ) : <View />}

                <TouchableOpacity
                    onPress={
                        () => {
                            setOpenDropdown(null);
                            handleNext();
                        }
                    }
                    disabled={loading}
                    style={tw`px-8 py-3 bg-[#8b5cf6] rounded-full flex-row items-center gap-1.5`}
                >
                    <Text style={tw`text-white font-bold`}>
                        {loading ? 'Submitting...' : currentStep === 4 ? 'Submit' : 'Next'}
                    </Text>
                    <ChevronRight size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
