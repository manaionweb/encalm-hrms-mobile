import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useColorScheme, TextInput, Linking, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, User, CreditCard, Briefcase, Calendar, Users, FileText, Trash2, Upload, Eye, X } from 'lucide-react-native';
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

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const employeeId = id || 'me';
            const endpoint = id ? `/employee/${id}` : '/employee/me';
            
            const [profileRes, customRes] = await Promise.all([
                api.get(endpoint),
                api.get(`/custom-fields/employee/${employeeId}`)
            ]);

            setEmployee(profileRes.data);
            setCustomAssignments(Array.isArray(customRes.data) ? customRes.data : []);
        } catch (error) {
            console.error('Error fetching employee and custom fields:', error);
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

    const handleExportPayslip = async () => {
        if (!employee) return;
        const prof = employee.employeeProfile || {};
        const salary = prof.salary || {};

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #1e293b; }
                        h1 { color: #4f46e5; text-align: center; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                        .table th { bg-color: #f1f5f9; }
                    </style>
                </head>
                <body>
                    <h1>EnCalm HRX Payslip</h1>
                    <h3>Employee Name: ${employee.name}</h3>
                    <p>Email: ${employee.email}</p>
                    <p>Designation: ${prof.title || 'N/A'}</p>
                    <p>Department: ${prof.department || 'N/A'}</p>
                    <table class="table">
                        <tr>
                            <th>Basic Monthly Salary</th>
                            <td>INR ${salary.basic || '0'}</td>
                        </tr>
                        <tr>
                            <th>Bank Name</th>
                            <td>${prof.bank?.bankName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Account Number</th>
                            <td>${prof.bank?.accountNumber || 'N/A'}</td>
                        </tr>
                    </table>
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

                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200 mt-1`}>
                        {String((typeof employee.role === 'object' ? employee.role?.name : employee.role) || 'HR_ADMIN')} - {String(profile.title || 'hr')}
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
                            {renderEditableDetailRow('Phone', profile.phone, formPhone, setFormPhone, 'e.g. 1119299291', 'number-pad')}
                            {renderDetailRow('Email', employee.email)}
                            {renderEditableDetailRow('Date of Birth (YYYY-MM-DD)', profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '', formDob, setFormDob, 'YYYY-MM-DD')}
                            {renderDetailRow('Date of Joining', profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : '')}
                            {renderDetailRow('System Role', typeof employee.role === 'object' ? employee.role?.name : String(employee.role || 'EMPLOYEE'))}
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
                                        const val = ca.value || ca.fieldValue || (formCustomFields && formCustomFields[ca.fieldId]) || 'N/A';
                                        if (isEditing) {
                                            return (
                                                <View key={ca.id} style={tw`py-2.5 border-b border-gray-50 dark:border-slate-700/20`}>
                                                    <Text style={tw`text-xs font-bold text-gray-400 dark:text-purple-200 uppercase mb-1.5`}>{ca.field?.name || 'Custom Field'}</Text>
                                                    <TextInput
                                                        style={tw`w-full px-3 py-2 bg-[#f5f3ff] dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white font-bold h-9`}
                                                        value={formCustomFields[ca.fieldId] || ''}
                                                        onChangeText={(text) => {
                                                            setFormCustomFields(prev => ({
                                                                ...prev,
                                                                [ca.fieldId]: text
                                                            }));
                                                        }}
                                                        placeholder={`Enter ${ca.field?.name || 'field'}`}
                                                        placeholderTextColor="#94a3b8"
                                                    />
                                                </View>
                                            );
                                        }

                                        return renderDetailRow(ca.field?.name || 'Custom Field', String(val));
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
                                                        {ca.field?.name || 'Document'} {ca.field?.required ? <Text style={tw`text-red-500`}>*</Text> : null}
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

                                                {/* Eye view button styled exactly like web */}
                                                {!!ca.documentUrl && (
                                                    <TouchableOpacity 
                                                        onPress={() => handleViewDocument(ca.documentUrl)}
                                                        style={tw`w-10 h-10 rounded-full flex items-center justify-center bg-[#8b5cf6]/10 dark:bg-white/10`}
                                                    >
                                                        <Eye size={18} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                                                    </TouchableOpacity>
                                                )}

                                                {/* Delete Button in Edit Mode if file exists */}
                                                {isEditing && !!ca.documentUrl && (
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
                                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Timing:</Text>
                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                        {profile.shift?.inTime || '09:00'} - {profile.shift?.outTime || '18:00'}
                                    </Text>
                                </View>
                                
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Break:</Text>
                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                        {profile.shift?.breakDuration ?? 60} mins
                                    </Text>
                                </View>
                                
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Grace Time:</Text>
                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                        {profile.shift?.graceTime ?? 15} mins
                                    </Text>
                                </View>
                                
                                <View style={tw`flex-row justify-between`}>
                                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Night Shift:</Text>
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
                                                <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Name</Text>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.name || 'System Admin'}</Text>
                                            </View>
                                            
                                            <View style={tw`flex-row justify-between mb-2`}>
                                                <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Email</Text>
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{t.manager?.email || 'admin@example.com'}</Text>
                                            </View>
                                            
                                            <View style={tw`flex-row justify-between`}>
                                                <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Phone</Text>
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
                                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Name</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>System Admin</Text>
                                    </View>
                                    
                                    <View style={tw`flex-row justify-between mb-2`}>
                                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Email</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>admin@example.com</Text>
                                    </View>
                                    
                                    <View style={tw`flex-row justify-between`}>
                                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200`}>Team Manager Phone</Text>
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

            </View>
        </KeyboardAvoidingView>
    );
}
