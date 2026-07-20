import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Search, Filter, Calendar, Mail, ArrowLeft, UserMinus } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';

export default function LeaveTodayScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [employeesOnLeave, setEmployeesOnLeave] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [leaveRes, empRes] = await Promise.all([
                api.get('/leave/history?all=true'),
                api.get('/employee')
            ]);

            const today = new Date().toISOString().split('T')[0];
            const employeesList = empRes.data;

            const onLeaveToday = leaveRes.data.filter((leave: any) => {
                if (!leave.startDate || !leave.endDate) return false;
                const start = new Date(leave.startDate).toISOString().split('T')[0];
                const end = new Date(leave.endDate).toISOString().split('T')[0];
                return today >= start && today <= end && leave.status === 'APPROVED';
            }).map((leave: any) => {
                const fullEmp = employeesList.find((e: any) => e.id === leave.userId);
                return {
                    ...leave,
                    fullEmployee: fullEmp
                };
            });

            setEmployeesOnLeave(onLeaveToday);
        } catch (error) {
            console.error('Error fetching leave data:', error);
            Alert.alert('Error', 'Failed to load leave data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredLeaves = employeesOnLeave.filter(leave => {
        const emp = leave.fullEmployee || {};
        const profile = emp.employeeProfile || {};
        const name = emp.name || leave.user?.name || '';
        const email = emp.email || '';
        const title = profile.title || '';
        const status = profile.status || 'Active';

        const matchesSearch = name.toLowerCase().includes(searchText.toLowerCase()) ||
                              email.toLowerCase().includes(searchText.toLowerCase()) ||
                              title.toLowerCase().includes(searchText.toLowerCase());

        const matchesStatus = selectedStatus === 'All' || status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    const renderLeaveCard = ({ item, index }: { item: any; index: number }) => {
        const emp = item.fullEmployee || {};
        const profile = emp.employeeProfile || {};
        const name = emp.name || item.user?.name || 'Unknown';
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
        const avatarBg = colors[index % colors.length];
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

        return (
            <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl mb-4 border border-gray-100 dark:border-[#8b5cf6]/30 shadow-sm relative overflow-hidden`}>
                <View style={tw`absolute top-0 left-0 w-1 h-full bg-orange-500`} />
                <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-row gap-3 flex-1`}>
                        <View style={tw`w-12 h-12 rounded-2xl ${avatarBg} flex items-center justify-center shadow-sm`}>
                            <Text style={tw`text-white font-bold text-base`}>{initials}</Text>
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-bold text-gray-800 dark:text-white text-base`}>{name}</Text>
                            <Text style={tw`text-gray-500 dark:text-gray-400 text-xs mt-0.5`}>{profile.title || 'Employee'}</Text>
                        </View>
                    </View>
                </View>

                <View style={tw`gap-y-2 mb-4`}>
                    <View style={tw`flex-row items-center gap-2 text-sm`}>
                        <Calendar size={14} color="#f97316" />
                        <Text style={tw`text-gray-600 dark:text-gray-400 text-xs font-semibold`}>
                            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2 text-sm mt-1.5`}>
                        <Mail size={14} color="#94a3b8" />
                        <Text style={tw`text-gray-600 dark:text-gray-400 text-xs font-medium`}>
                            {emp.email || 'Email not available'}
                        </Text>
                    </View>
                </View>

                <View style={tw`flex-row items-center justify-between pt-3.5 border-t border-gray-100 dark:border-white/5`}>
                    <View style={tw`px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20`}>
                        <Text style={tw`text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider`}>
                            On Leave
                        </Text>
                    </View>
                    {emp.id ? (
                        <TouchableOpacity onPress={() => navigation.navigate('EmployeeProfile', { id: emp.id })}>
                            <Text style={tw`text-xs font-bold text-[#8b5cf6] dark:text-[#c4b5fd]`}>
                                View Profile
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            <CustomHeader navigation={navigation} title="On Leave Today" showBackButton={true} />

            <View style={tw`flex-1 px-4 pt-4`}>
                {/* Header info */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View style={tw`flex-1 mr-2`}>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 font-medium`}>
                            List of employees currently away from work
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-1.5 px-3.5 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl`}>
                        <UserMinus size={14} color="#f97316" />
                        <Text style={tw`text-xs font-bold text-orange-700 dark:text-orange-400`}>
                            {employeesOnLeave.length} Employees
                        </Text>
                    </View>
                </View>

                {/* Search and Filters */}
                <View style={tw`flex-row items-center bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-[#8b5cf6]/30 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                        placeholder="Search by name, email or role..."
                        placeholderTextColor="#94a3b8"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={tw`p-1.5`}>
                        <Filter size={18} color={showFilters ? "#8b5cf6" : '#94a3b8'} />
                    </TouchableOpacity>
                </View>

                {showFilters && (
                    <View style={tw`bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-[#8b5cf6]/30 rounded-2xl p-4 mb-4 shadow-sm flex-row justify-around`}>
                        {['All', 'Active', 'Inactive'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setSelectedStatus(status)}
                                style={tw`px-4 py-1.5 rounded-full ${selectedStatus === status ? 'bg-[#8b5cf6]' : 'bg-gray-100 dark:bg-white/5'}`}
                            >
                                <Text style={tw`text-xs font-bold ${selectedStatus === status ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {status} Status
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {loading ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                        <Text style={tw`text-gray-500 dark:text-gray-400 text-xs font-semibold mt-3`}>
                            Fetching leave data...
                        </Text>
                    </View>
                ) : filteredLeaves.length === 0 ? (
                    <View style={tw`flex-1 justify-center items-center py-20 bg-white dark:bg-[#4c1d95] rounded-3xl border border-gray-100 dark:border-[#8b5cf6]/30 shadow-inner mt-4 h-64`}>
                        <Calendar size={48} color="#cbd5e1" style={tw`mb-4 opacity-50`} />
                        <Text style={tw`text-lg font-bold text-gray-800 dark:text-white`}>No Employees Found</Text>
                        <Text style={tw`text-gray-500 dark:text-gray-400 mt-2 text-xs text-center px-4`}>
                            Try adjusting your filters or search term.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredLeaves}
                        renderItem={renderLeaveCard}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={tw`pb-12`}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}
