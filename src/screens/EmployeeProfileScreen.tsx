import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { ArrowLeft, User, CreditCard, Download, Briefcase, Calendar, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../utils/api';
import tw from 'twrnc';

type ProfileTab = 'personal' | 'statutory' | 'salary' | 'shifts' | 'team';

export default function EmployeeProfileScreen({ route, navigation }: any) {
    const { id } = route.params || {};
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const endpoint = id ? `/employee/${id}` : '/employee/me';
            const res = await api.get(endpoint);
            setEmployee(res.data);
        } catch (error) {
            console.error('Error fetching employee:', error);
            Alert.alert('Error', 'Failed to load employee profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const handleExportPayslip = async () => {
        if (!employee) return;
        const profile = employee.employeeProfile || {};
        const salary = profile.salary || {};

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
                    <p>Designation: ${profile.title || 'N/A'}</p>
                    <p>Department: ${profile.department || 'N/A'}</p>
                    <table class="table">
                        <tr>
                            <th>Basic Monthly Salary</th>
                            <td>INR ${salary.basic || '0'}</td>
                        </tr>
                        <tr>
                            <th>Bank Name</th>
                            <td>${profile.bank?.bankName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Account Number</th>
                            <td>${profile.bank?.accountNumber || 'N/A'}</td>
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
            <View style={tw`flex-1 items-center justify-center bg-gray-50 dark:bg-slate-900`}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!employee) {
        return (
            <View style={tw`flex-1 items-center justify-center`}>
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

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>
            
            {/* Header */}
            <View style={[
                tw`flex-row items-center justify-between px-4 pb-4 bg-white dark:bg-slate-800 border-b border-gray-150 dark:border-slate-700`,
                { paddingTop: insets.top + 16 }
            ]}>
                <View style={tw`flex-row items-center`}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                        <ArrowLeft size={20} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Employee Profile</Text>
                </View>
                <TouchableOpacity onPress={handleExportPayslip} style={tw`p-2`}>
                    <Download size={20} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-grow`}>
                
                {/* Profile Banner */}
                <View style={tw`items-center py-6 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mb-4`}>
                    <View style={tw`w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-slate-700 flex items-center justify-center mb-3`}>
                        <Text style={tw`text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl`}>{initials}</Text>
                    </View>
                    <Text style={tw`text-xl font-bold text-gray-900 dark:text-white`}>{employee.name}</Text>
                    <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-1`}>{profile.title || 'No Role'}</Text>
                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>{profile.department || 'No Department'}</Text>
                </View>

                {/* Tab selectors */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row bg-white dark:bg-slate-800 py-3 px-4 border-b border-gray-100 dark:border-slate-700 mb-4`}>
                    {[
                        { key: 'personal', label: 'Personal', icon: User },
                        { key: 'statutory', label: 'Statutory', icon: CreditCard },
                        { key: 'salary', label: 'Salary', icon: Briefcase },
                        { key: 'shifts', label: 'Shifts', icon: Calendar },
                        { key: 'team', label: 'Team', icon: Users },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key as ProfileTab)}
                            style={tw`flex-row items-center gap-1.5 px-4 py-2 rounded-xl mr-2 ${activeTab === tab.key ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-slate-700'}`}
                        >
                            <tab.icon size={14} color={activeTab === tab.key ? '#fff' : '#64748b'} />
                            <Text style={tw`text-xs font-bold ${activeTab === tab.key ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Tab content panel */}
                <View style={tw`bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 mx-4 shadow-sm mb-8`}>
                    
                    {activeTab === 'personal' && (
                        <View>
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Personal Details</Text>
                            {renderDetailRow('E-mail', employee.email)}
                            {renderDetailRow('Phone', profile.phone)}
                            {renderDetailRow('DOB', profile.dob)}
                            {renderDetailRow('Blood Group', profile.bloodGroup)}
                            {renderDetailRow('Address', profile.address)}
                            {renderDetailRow('Joining Date', profile.joiningDate)}
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
                            {renderDetailRow('Basic Monthly', `INR ${profile.salary?.basic || '0'}`)}
                        </View>
                    )}

                    {activeTab === 'shifts' && (
                        <View>
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Work Shift Roster</Text>
                            {renderDetailRow('Active Shift', profile.shift?.name || 'Default Shift')}
                            {renderDetailRow('Timing', `${profile.shift?.inTime || '09:00'} - ${profile.shift?.outTime || '18:00'}`)}
                        </View>
                    )}

                    {activeTab === 'team' && (
                        <View>
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-4`}>Team & Reporting</Text>
                            {renderDetailRow('Manager', profile.managerName || 'No direct reporting manager')}
                        </View>
                    )}

                </View>

            </ScrollView>

        </View>
    );
}
