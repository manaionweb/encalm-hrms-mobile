import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Share } from 'react-native';
import { Search, Filter, Plus, FileText, User, Mail, Phone, MoreVertical } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';

export default function EmployeeListScreen({ navigation }: any) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get('/employee');
            setEmployees(res.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            Alert.alert('Error', 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const profile = emp.employeeProfile || {};
        const nameMatch = emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchText.toLowerCase()) ||
                          (profile.title || '').toLowerCase().includes(searchText.toLowerCase());
        
        const statusMatch = selectedStatus === 'All' || (profile.status || 'Active') === selectedStatus;

        return nameMatch && statusMatch;
    });

    const handleExportCSV = async () => {
        try {
            const csvRows = ["ID,Name,Email,Role,Department,Location,Status"];
            filteredEmployees.forEach((emp) => {
                const profile = emp.employeeProfile || {};
                csvRows.push(`${emp.id},"${emp.name}","${emp.email}","${profile.title || ""}","${profile.department || ""}","${profile.location || ""}","${profile.status || "Active"}"`);
            });
            const csvContent = csvRows.join("\n");

            await Share.share({
                message: csvContent,
                title: 'Employees List Export',
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const renderEmployeeCard = ({ item }: { item: any }) => {
        const profile = item.employeeProfile || {};
        const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('EmployeeProfile', { id: item.id })}
                style={tw`bg-white dark:bg-slate-800 p-4 rounded-3xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm flex-row items-center justify-between`}
            >
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <View style={tw`w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center mr-3`}>
                        <Text style={tw`text-indigo-600 dark:text-indigo-400 font-bold text-sm`}>{initials}</Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-bold text-gray-900 dark:text-white text-sm`}>{item.name}</Text>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-0.5`}>{profile.title || 'No Role'}</Text>
                        <View style={tw`flex-row items-center gap-1.5 mt-1.5`}>
                            <View style={tw`w-1.5 h-1.5 rounded-full ${profile.status === 'Inactive' ? 'bg-rose-500' : 'bg-green-500'}`} />
                            <Text style={tw`text-[10px] text-gray-400 font-bold`}>{profile.status || 'Active'}</Text>
                        </View>
                    </View>
                </View>
                
                <TouchableOpacity 
                    onPress={() => {
                        Alert.alert(
                            item.name,
                            "Select Action",
                            [
                                { text: "View Profile", onPress: () => navigation.navigate('EmployeeProfile', { id: item.id }) },
                                { text: "View Attendance", onPress: () => navigation.navigate('Attendance', { id: item.id }) },
                                { text: "Cancel", style: "cancel" }
                            ]
                        );
                    }}
                    style={tw`p-2`}
                >
                    <MoreVertical size={20} color="#94a3b8" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>
            <CustomHeader navigation={navigation} title="Employees" />
            
            <View style={tw`flex-1 px-4 pt-4`}>
                
                {/* Header Actions Row */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View>
                        <Text style={tw`text-xs text-gray-550 dark:text-gray-400 font-medium`}>Manage organizational workforce</Text>
                    </View>
                    <View style={tw`flex-row gap-2`}>
                        <TouchableOpacity
                            onPress={handleExportCSV}
                            style={tw`p-2.5 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl shadow-sm`}
                        >
                            <FileText size={18} color="#64748b" />
                        </TouchableOpacity>
                        {isAdmin && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AddEmployee')}
                                style={tw`flex-row items-center gap-1.5 px-4 py-2.5 bg-indigo-600 rounded-2xl shadow-md`}
                            >
                                <Plus size={16} color="white" />
                                <Text style={tw`text-white font-bold text-xs`}>Add Employee</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            {/* Search Bar */}
            <View style={tw`flex-row items-center bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                <TextInput
                    style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                    placeholder="Search employees..."
                    placeholderTextColor="#94a3b8"
                    value={searchText}
                    onChangeText={setSearchText}
                />
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={tw`p-1.5`}>
                    <Filter size={18} color={showFilters ? '#6366f1' : '#94a3b8'} />
                </TouchableOpacity>
            </View>

            {/* Quick Filters */}
            {showFilters && (
                <View style={tw`bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-2xl mb-4 shadow-sm flex-row gap-2`}>
                    {['All', 'Active', 'Inactive'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setSelectedStatus(status)}
                            style={tw`px-4 py-1.5 rounded-full ${selectedStatus === status ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-slate-700'}`}
                        >
                            <Text style={tw`text-xs font-bold ${selectedStatus === status ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* List */}
            {loading ? (
                <View style={tw`flex-1 justify-center py-20`}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderEmployeeCard}
                    ListEmptyComponent={
                        <Text style={tw`text-center text-gray-400 py-10 font-medium`}>No employees found.</Text>
                    }
                    contentContainerStyle={tw`pb-8`}
                />
            )}
            </View>
        </View>
    );
}
