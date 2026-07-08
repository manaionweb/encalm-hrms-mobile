import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react-native';
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
        } catch (error) {
            console.error('Failed to pick custom field file:', error);
            Alert.alert('Error', 'Failed to select file.');
        }
    };

    const renderCustomFieldInput = (cf: any) => {
        const fieldId = String(cf.id);
        const value = customFieldValues[fieldId] || '';

        // File-like custom uploads
        if (['FILE', 'PDF', 'IMAGE', 'FILE_UPLOAD', 'PDF_DOCUMENT'].includes(cf.type?.toUpperCase())) {
            const hasFile = !!selectedFiles[`custom-file-${fieldId}`];
            return (
                <View key={cf.id} style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase`}>{cf.name}</Text>
                    <TouchableOpacity
                        onPress={() => handlePickCustomFile(fieldId)}
                        style={tw`w-full px-4 py-3 bg-[#f5f3ff] border border-gray-300 border-dashed rounded-xl items-center justify-center`}
                    >
                        <Text style={tw`text-xs font-bold text-[#8b5cf6] truncate max-w-[90%]`}>
                            {hasFile ? selectedFiles[`custom-file-${fieldId}`].name : `Choose ${cf.name} File`}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Radio list layout
        if (cf.type?.toUpperCase() === 'RADIO' || cf.type?.toUpperCase() === 'RADIO_BUTTON') {
            const options = cf.options ? cf.options.split(',') : ['Yes', 'No'];
            return (
                <View key={cf.id} style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase`}>{cf.name}</Text>
                    <View style={tw`flex-row gap-2`}>
                        {options.map((opt: string) => {
                            const trimmedOpt = opt.trim();
                            const isSelected = value === trimmedOpt;
                            return (
                                <TouchableOpacity
                                    key={trimmedOpt}
                                    onPress={() => setCustomFieldValues(prev => ({ ...prev, [fieldId]: trimmedOpt }))}
                                    style={tw`flex-1 py-2.5 rounded-xl border items-center ${isSelected ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-gray-300'}`}
                                >
                                    <Text style={tw`text-xs font-bold ${isSelected ? 'text-[#8b5cf6]' : 'text-gray-550'}`}>{trimmedOpt}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            );
        }

        // Standard inputs
        const keyboardType = cf.type?.toUpperCase() === 'NUMBER' ? 'numeric' : 'default';
        const secureTextEntry = cf.type?.toUpperCase() === 'PASSWORD';

        return (
            <View key={cf.id} style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase`}>{cf.name}</Text>
                <TextInput
                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] border border-gray-300 rounded-xl text-gray-800`}
                    placeholder={`Enter ${cf.name}`}
                    placeholderTextColor="#cbd5e1"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    value={value}
                    onChangeText={(text) => setCustomFieldValues(prev => ({ ...prev, [fieldId]: text }))}
                />
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
                departmentId: parseInt(formData.departmentId),
                designationId: parseInt(formData.designationId),
                joiningDate: formData.joiningDate,
                panNumber: formData.pan,
                aadhaarNumber: formData.aadhaar,
                uanNumber: formData.uan,
                esicNumber: formData.esic,
                bankName: formData.bankName,
                ifscCode: formData.ifsc,
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
            <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase`}>{label}</Text>
            <TextInput
                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] border ${errors[field] ? 'border-red-500' : 'border-gray-300'} rounded-xl text-gray-805`}
                placeholder={placeholder}
                placeholderTextColor="#cbd5e1"
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

    const personalCustomFields = customFields.filter(cf => cf.category === 'PERSONAL_DETAILS');
    const documentCustomFields = customFields.filter(cf => cf.category === 'DOCUMENT_VAULT');

    return (
        <View style={[
            tw`flex-1 bg-white px-4`,
            { paddingTop: insets.top + 16 }
        ]}>
            
            {/* Header */}
            <View style={tw`flex-row items-center mb-6`}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                    <ArrowLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={tw`text-lg font-bold text-gray-900`}>Add Employee</Text>
            </View>

            {/* Steps Indicator */}
            <View style={tw`flex-row justify-between mb-6 px-4`}>
                {[1, 2, 3].map((step) => (
                    <View key={step} style={tw`items-center`}>
                        <View style={tw`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= step ? 'bg-[#8b5cf6]' : 'bg-gray-200'}`}>
                            <Text style={tw`text-white font-bold text-xs`}>{step}</Text>
                        </View>
                        <Text style={tw`text-[10px] font-bold text-gray-500 mt-1`}>
                            {step === 1 ? 'Personal' : step === 2 ? 'Statutory' : 'Salary'}
                        </Text>
                    </View>
                ))}
            </View>

            <ScrollView style={tw`flex-grow`} keyboardShouldPersistTaps="handled">
                {currentStep === 1 && (
                    <View>
                        {renderInput('First Name *', 'firstName', 'John')}
                        {renderInput('Last Name *', 'lastName', 'Doe')}
                        {renderInput('Email *', 'email', 'john.doe@company.com', 'email-address')}
                        {renderInput('Phone *', 'phone', '9876543210', 'phone-pad')}
                        {renderInput('DOB *', 'dob', 'YYYY-MM-DD')}
                        {renderInput('Blood Group', 'bloodGroup', 'O+')}
                        {renderInput('Address', 'address', 'Enter Address')}
                        {renderInput('Department ID *', 'departmentId', 'e.g. 1', 'numeric')}
                        {renderInput('Role ID *', 'roleId', 'e.g. 2', 'numeric')}
                        {renderInput('Designation ID *', 'designationId', 'e.g. 3', 'numeric')}

                        {/* Custom Personal Details Configuration */}
                        {personalCustomFields.length > 0 && (
                            <View style={tw`mt-6 pt-4 border-t border-gray-150`}>
                                <Text style={tw`text-xs font-black text-gray-500 mb-3 uppercase tracking-wider`}>Additional Details</Text>
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

                        {/* Custom Document Vault Configuration */}
                        {documentCustomFields.length > 0 && (
                            <View style={tw`mt-6 pt-4 border-t border-gray-150`}>
                                <Text style={tw`text-xs font-black text-gray-500 mb-3 uppercase tracking-wider`}>Document Vault</Text>
                                {documentCustomFields.map(cf => renderCustomFieldInput(cf))}
                            </View>
                        )}
                    </View>
                )}

                {currentStep === 3 && (
                    <View>
                        {renderInput('Basic Monthly Salary *', 'basicSalary', 'e.g. 45000', 'numeric')}
                        {renderInput('Joining Date', 'joiningDate', 'YYYY-MM-DD')}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={tw`py-4 border-t border-gray-100 flex-row justify-between`}>
                {currentStep > 1 ? (
                    <TouchableOpacity
                        onPress={() => setCurrentStep(currentStep - 1)}
                        style={tw`px-6 py-3 bg-gray-100 rounded-full`}
                    >
                        <Text style={tw`text-gray-600 font-bold`}>Back</Text>
                    </TouchableOpacity>
                ) : <View />}

                <TouchableOpacity
                    onPress={handleNext}
                    disabled={loading}
                    style={tw`px-8 py-3 bg-[#8b5cf6] rounded-full flex-row items-center gap-1.5`}
                >
                    <Text style={tw`text-white font-bold`}>
                        {loading ? 'Submitting...' : currentStep === 3 ? 'Submit' : 'Next'}
                    </Text>
                    <ChevronRight size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
