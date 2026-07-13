import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Share, Modal, TouchableWithoutFeedback } from 'react-native';
import { Search, Filter, Plus, FileText, Mail, Phone, MoreVertical, MapPin, LayoutGrid, List, User, Calendar, Pencil, Trash2, X } from 'lucide-react-native';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedEmployeeForActions, setSelectedEmployeeForActions] = useState<any>(null);

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

    const handleDeleteEmployee = async (id: number, name: string) => {
        Alert.alert(
            "Delete Employee",
            `Are you sure you want to delete ${name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/employee/${id}`);
                            Alert.alert("Success", `${name} deleted successfully!`);
                            fetchEmployees();
                        } catch (error: any) {
                            console.error('Delete error:', error);
                            Alert.alert("Error", error.response?.data?.message || 'Failed to delete employee');
                        }
                    }
                }
            ]
        );
    };

    const renderEmployeeCard = ({ item }: { item: any }) => {
        const profile = item.employeeProfile || {};
        const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
        
        // Colors for avatar badge based on name or ID to look dynamic and premium
        const avatarBgs = [
            'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-rose-500'
        ];
        const avatarBg = avatarBgs[item.id % avatarBgs.length];

        return (
            <View 
                style={[
                    tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl mb-4 border-y border-r border-gray-150 dark:border-white/5 shadow-md border-l-4`,
                    profile.status === 'Inactive' ? tw`border-l-rose-500` : tw`border-l-green-500`
                ]}
            >
                {/* Top Row: Avatar + Name/Role + 3 Dots */}
                <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-row items-center flex-1 mr-2`}>
                        <View style={tw`w-12 h-12 rounded-2xl ${avatarBg} flex items-center justify-center mr-3 shadow-sm`}>
                            <Text style={tw`text-white font-black text-base`}>{initials}</Text>
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-bold text-gray-900 dark:text-white text-base`}>{item.name}</Text>
                            <Text style={tw`text-xs text-gray-500 dark:text-gray-300 font-medium capitalize mt-0.5`}>
                                {profile.title || 'employee'}
                            </Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={() => setSelectedEmployeeForActions(item)}
                        style={tw`p-1`}
                    >
                        <MoreVertical size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {/* Details Section */}
                <View style={tw`gap-2 mb-4 border-t border-gray-100 dark:border-white/5 pt-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <MapPin size={14} color="#a78bfa" />
                        <Text style={tw`text-xs text-gray-600 dark:text-gray-200`}>
                            {profile.location || 'N/A'}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <Mail size={14} color="#a78bfa" />
                        <Text style={tw`text-xs text-gray-600 dark:text-gray-200`}>
                            {item.email}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <Phone size={14} color="#a78bfa" />
                        <Text style={tw`text-xs text-gray-600 dark:text-gray-200`}>
                            {profile.phone || 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* Bottom Row: Status Badge + View Profile Link */}
                <View style={tw`flex-row justify-between items-center border-t border-gray-100 dark:border-white/5 pt-3`}>
                    <View style={[
                        tw`px-2.5 py-1 rounded-full`,
                        profile.status === 'Inactive' 
                            ? tw`bg-rose-50 dark:bg-rose-500/10` 
                            : tw`bg-green-50 dark:bg-green-500/10`
                    ]}>
                        <Text style={[
                            tw`text-[10px] font-black tracking-wider uppercase`,
                            profile.status === 'Inactive' 
                                ? tw`text-rose-600 dark:text-rose-400` 
                                : tw`text-green-600 dark:text-green-400`
                        ]}>
                            {profile.status || 'ACTIVE'}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('EmployeeProfile', { id: item.id })}
                        style={tw`flex-row items-center gap-1`}
                    >
                        <Text style={tw`text-xs text-purple-650 dark:text-[#c4b5fd] font-bold`}>View Profile</Text>
                        <Text style={tw`text-xs text-purple-650 dark:text-[#c4b5fd] font-bold`}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEmployeeListCard = ({ item }: { item: any }) => {
        const profile = item.employeeProfile || {};
        const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
        
        const avatarBgs = [
            'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-rose-500'
        ];
        const avatarBg = avatarBgs[item.id % avatarBgs.length];

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('EmployeeProfile', { id: item.id })}
                style={[
                    tw`bg-white dark:bg-[#4c1d95] p-3 rounded-2xl mb-3 border-y border-r border-gray-150 dark:border-white/5 shadow-sm flex-row items-center justify-between border-l-4`,
                    profile.status === 'Inactive' ? tw`border-l-rose-500` : tw`border-l-green-500`
                ]}
            >
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <View style={tw`w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center mr-3 shadow-sm`}>
                        <Text style={tw`text-white font-black text-xs`}>{initials}</Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text numberOfLines={1} style={tw`font-bold text-gray-900 dark:text-white text-sm`}>{item.name}</Text>
                        <Text numberOfLines={1} style={tw`text-[10px] text-gray-500 dark:text-gray-300 capitalize mt-0.5`}>
                            {profile.title || 'employee'} • {profile.department || 'General'}
                        </Text>
                    </View>
                </View>

                {/* Right side: Status pill + 3-dots */}
                <View style={tw`flex-row items-center gap-2.5`}>
                    <View style={[
                        tw`px-2 py-0.5 rounded-full`,
                        profile.status === 'Inactive' 
                            ? tw`bg-rose-50 dark:bg-rose-500/10` 
                            : tw`bg-green-50 dark:bg-green-500/10`
                    ]}>
                        <Text style={[
                            tw`text-[8px] font-black tracking-wide uppercase`,
                            profile.status === 'Inactive' 
                                ? tw`text-rose-600 dark:text-rose-400` 
                                : tw`text-green-600 dark:text-green-400`
                        ]}>
                            {profile.status === 'Inactive' ? 'Inactive' : 'Active'}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => setSelectedEmployeeForActions(item)}
                        style={tw`p-1.5`}
                    >
                        <MoreVertical size={16} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            <CustomHeader navigation={navigation} title="Employees" />
            
            <View style={tw`flex-1 px-4 pt-4`}>
                
                {/* Header Actions Row */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View style={tw`flex-1 mr-3`}>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 font-medium`}>Manage organizational workforce</Text>
                    </View>
                    <View style={tw`flex-row gap-2`}>
                        <TouchableOpacity
                            onPress={handleExportCSV}
                            style={tw`p-2.5 bg-white dark:bg-[#4c1d95] border border-gray-150 dark:border-white/5 rounded-2xl shadow-sm`}
                        >
                            <FileText size={18} color="#64748b" />
                        </TouchableOpacity>
                        {isAdmin && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AddEmployee')}
                                style={tw`flex-row items-center gap-1.5 px-4 py-2.5 bg-[#8b5cf6] rounded-2xl shadow-md`}
                            >
                                <Plus size={16} color="white" />
                                <Text style={tw`text-white font-bold text-xs`}>Add Employee</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Search Bar and View Mode Toggle */}
                <View style={tw`flex-row gap-2 mb-4`}>
                    <View style={tw`flex-1 flex-row items-center bg-white dark:bg-[#4c1d95] border border-gray-150 dark:border-white/5 rounded-2xl px-3 py-1 shadow-sm`}>
                        <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                        <TextInput
                            style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                            placeholder="Search employees..."
                            placeholderTextColor="#94a3b8"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={tw`p-1.5`}>
                            <Filter size={18} color={showFilters ? "#8b5cf6" : '#94a3b8'} />
                        </TouchableOpacity>
                    </View>

                    {/* Grid/List Toggle */}
                    <View style={tw`flex-row bg-white dark:bg-[#4c1d95] border border-gray-150 dark:border-white/5 rounded-2xl p-1 shadow-sm items-center gap-1`}>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            style={tw`p-1.5 rounded-xl ${viewMode === 'grid' ? 'bg-[#8b5cf6]' : 'bg-transparent'}`}
                        >
                            <LayoutGrid size={16} color={viewMode === 'grid' ? 'white' : '#94a3b8'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={tw`p-1.5 rounded-xl ${viewMode === 'list' ? 'bg-[#8b5cf6]' : 'bg-transparent'}`}
                        >
                            <List size={16} color={viewMode === 'list' ? 'white' : '#94a3b8'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Filters */}
                {showFilters && (
                    <View style={tw`bg-white dark:bg-[#4c1d95] border border-gray-150 dark:border-white/5 p-3 rounded-2xl mb-4 shadow-sm flex-row gap-2`}>
                        {['All', 'Active', 'Inactive'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setSelectedStatus(status)}
                                style={tw`px-4 py-1.5 rounded-full ${selectedStatus === status ? 'bg-[#8b5cf6]' : 'bg-gray-105 dark:bg-[#8b5cf6]/20'}`}
                            >
                                <Text style={tw`text-xs font-bold ${selectedStatus === status ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* List */}
                {loading ? (
                    <View style={tw`flex-1 justify-center py-20`}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredEmployees}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={viewMode === 'grid' ? renderEmployeeCard : renderEmployeeListCard}
                        ListEmptyComponent={
                            <Text style={tw`text-center text-gray-400 py-10 font-medium`}>No employees found.</Text>
                        }
                        contentContainerStyle={tw`pb-8`}
                    />
                )}
            </View>

            {/* Employee Actions Bottom Sheet Drawer Modal */}
            <Modal
                visible={!!selectedEmployeeForActions}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedEmployeeForActions(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedEmployeeForActions(null)}>
                    <View style={tw`flex-1 justify-end bg-black/60`}>
                        <TouchableWithoutFeedback>
                            <View style={tw`bg-white dark:bg-[#1c1a45] rounded-t-[2.5rem] p-8 border-t border-gray-200 dark:border-white/5`}>
                                {selectedEmployeeForActions && (
                                    <View style={tw`gap-6`}>
                                        {/* Header */}
                                        <View style={tw`flex-row justify-between items-start mb-4`}>
                                            <View style={tw`flex-row items-center gap-4`}>
                                                <View style={tw`w-16 h-16 rounded-2xl flex items-center justify-center bg-[#8b5cf6] shadow-xl`}>
                                                    <Text style={tw`text-white font-black text-2xl`}>
                                                        {selectedEmployeeForActions.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={tw`text-2xl font-black text-gray-900 dark:text-white tracking-tight`}>
                                                        {selectedEmployeeForActions.name}
                                                    </Text>
                                                    <Text style={tw`text-[#8b5cf6] dark:text-[#c4b5fd] font-bold uppercase text-xs tracking-widest mt-1`}>
                                                        {selectedEmployeeForActions.employeeProfile?.title || 'employee'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => setSelectedEmployeeForActions(null)}
                                                style={tw`p-2 bg-gray-50 dark:bg-white/5 rounded-xl`}
                                            >
                                                <X size={20} color="#94a3b8" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Action Buttons list */}
                                        <View style={tw`gap-3.5`}>
                                            {/* View Full Profile */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const empId = selectedEmployeeForActions.id;
                                                    setSelectedEmployeeForActions(null);
                                                    navigation.navigate('EmployeeProfile', { id: empId });
                                                }}
                                                style={tw`w-full flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-[#8b5cf6]/30`}
                                            >
                                                <View style={tw`p-3 bg-white dark:bg-[#12112b] rounded-xl shadow-sm`}>
                                                    <User size={20} color="#8b5cf6" />
                                                </View>
                                                <View>
                                                    <Text style={tw`font-bold text-gray-800 dark:text-white`}>View Full Profile</Text>
                                                    <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-0.5`}>Detailed overview and history</Text>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Edit Profile */}
                                            {isAdmin && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const empId = selectedEmployeeForActions.id;
                                                        setSelectedEmployeeForActions(null);
                                                        navigation.navigate('EmployeeProfile', { id: empId, edit: true });
                                                    }}
                                                    style={tw`w-full flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-[#8b5cf6]/30`}
                                                >
                                                    <View style={tw`p-3 bg-white dark:bg-[#12112b] rounded-xl shadow-sm`}>
                                                        <Pencil size={20} color="#f59e0b" />
                                                    </View>
                                                    <View>
                                                        <Text style={tw`font-bold text-gray-800 dark:text-white`}>Edit Profile</Text>
                                                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-0.5`}>Modify employee information</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}

                                            {/* Delete Employee */}
                                            {isAdmin && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const emp = selectedEmployeeForActions;
                                                        setSelectedEmployeeForActions(null);
                                                        handleDeleteEmployee(emp.id, emp.name);
                                                    }}
                                                    style={tw`w-full flex-row items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-transparent hover:border-rose-500/30`}
                                                >
                                                    <View style={tw`p-3 bg-white dark:bg-[#12112b] rounded-xl shadow-sm`}>
                                                        <Trash2 size={20} color="#f43f5e" />
                                                    </View>
                                                    <View>
                                                        <Text style={tw`font-bold text-rose-600 dark:text-rose-400`}>Delete Employee</Text>
                                                        <Text style={tw`text-xs text-rose-500/70 mt-0.5`}>Permanently remove from system</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
