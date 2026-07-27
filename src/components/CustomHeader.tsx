import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Menu, Bell, Sun, Moon, ArrowLeft, Search, X, User, LayoutGrid, Calendar, Users, FileText, Settings, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import tw from 'twrnc';

interface CustomHeaderProps {
    navigation: any;
    title: string;
    showBackButton?: boolean;
    subtitle?: string;
}

export default function CustomHeader({ navigation, title, showBackButton }: CustomHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user } = useAuth();
    const isDark = theme === 'dark';
    const isHrAdmin = user?.role === 'HR_ADMIN';

    const [unreadCount, setUnreadCount] = useState(0);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);

    const insets = useSafeAreaInsets();

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/notifications');
            if (Array.isArray(res.data)) {
                const unread = res.data.filter((n: any) => n.unread).length;
                setUnreadCount(unread);
            }
        } catch (e: any) {
            // Silently log or handle auth errors without throwing unhandled exceptions
            if (e?.response?.status !== 401 && e?.message !== 'No refresh token found') {
                console.log('Failed to get header notifications count:', e?.message || e);
            }
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employee');
            setEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Search fetch employees failed:', e);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 8000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const isDashboard = title.toLowerCase() === 'dashboard';
    const canGoBack = showBackButton !== undefined 
        ? showBackButton 
        : !isDashboard;

    const handleBack = () => {
        if (navigation) {
            if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                navigation.goBack();
            } else if (typeof navigation.navigate === 'function') {
                navigation.navigate('Dashboard');
            }
        }
    };

    const handleOpenSearch = () => {
        setShowSearchModal(true);
        setSearchQuery('');
        fetchEmployees();
    };

    const handleNavigate = (target: { route: string; stack?: string; params?: any }) => {
        setShowSearchModal(false);
        setSearchQuery('');
        if (!navigation) return;

        if (target.stack) {
            navigation.navigate(target.stack, {
                screen: target.route,
                params: target.params,
            });
        } else {
            navigation.navigate(target.route, target.params);
        }
    };

    const navItems = [
        { name: 'Dashboard', route: 'Dashboard', icon: LayoutGrid, adminOnly: false },
        { name: 'Attendance', route: 'Attendance', icon: Calendar, adminOnly: false },
        { name: 'My Leave', route: 'Leave', params: { activeTab: 'MY_LEAVE' }, icon: FileText, adminOnly: false },
        { name: 'Leave Approval', route: 'Leave', params: { activeTab: 'APPROVALS' }, icon: FileText, adminOnly: true },
        { name: 'Regularizations', stack: 'EmployeeStack', route: 'Regularizations', icon: Check, adminOnly: true },
        { name: 'Employee List', stack: 'EmployeeStack', route: 'EmployeeList', icon: Users, adminOnly: true },
        { name: 'Team', route: 'Team', icon: Users, adminOnly: false },
        { name: 'Reports', route: 'Reports', icon: FileText, adminOnly: true },
        { name: 'Masters', route: 'Masters', icon: Settings, adminOnly: true },
        { name: 'My Profile', stack: 'EmployeeStack', route: 'EmployeeProfile', params: { employeeId: user?.id }, icon: User, adminOnly: false },
        { name: 'On Leave Today', route: 'LeaveToday', icon: Calendar, adminOnly: true },
        { name: 'New Joiners', route: 'NewJoiners', icon: Users, adminOnly: true },
        { name: 'Notifications', route: 'Notifications', icon: Bell, adminOnly: false },
    ];

    const filteredNav = searchQuery.trim() === '' ? [] : navItems.filter((item) => {
        if (item.adminOnly && !isHrAdmin) return false;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredEmployees = searchQuery.trim() === '' ? [] : employees.filter((emp) => {
        if (!isHrAdmin && emp?.id !== user?.id) return false;
        const name = typeof emp?.name === 'string' ? emp.name : '';
        const email = typeof emp?.email === 'string' ? emp.email : '';
        const role = typeof emp?.role === 'string' ? emp.role : (typeof emp?.role?.name === 'string' ? emp.role.name : '');
        const title = typeof emp?.employeeProfile?.title === 'string' ? emp.employeeProfile.title : '';
        const queryLower = searchQuery.toLowerCase();
        return name.toLowerCase().includes(queryLower) ||
            email.toLowerCase().includes(queryLower) ||
            role.toLowerCase().includes(queryLower) ||
            title.toLowerCase().includes(queryLower);
    }).slice(0, 8);

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <View style={[
            tw`flex-row items-center justify-between bg-white dark:bg-[#0B0A1F] border-b border-gray-100 dark:border-white/5`,
            {
                paddingTop: insets.top + 8,
                paddingHorizontal: 12,
                paddingBottom: 10,
            },
        ]}>

            {/* Left: Back button / Menu + Title */}
            <View style={tw`flex-row items-center flex-1 mr-2`}>
                {canGoBack ? (
                    <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.7}
                        style={tw`p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                    >
                        <ArrowLeft size={18} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => navigation.openDrawer()}
                        activeOpacity={0.7}
                        style={tw`p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                    >
                        <Menu size={18} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                    </TouchableOpacity>
                )}

                <Text 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                    style={tw`text-sm font-black text-[#1e1b4b] dark:text-white tracking-tight ml-2.5 flex-1`}
                >
                    {title}
                </Text>
            </View>

            {/* Right: Search, Theme, Bell, User Avatar */}
            <View style={tw`flex-row items-center gap-1.5`}>
                <TouchableOpacity
                    onPress={handleOpenSearch}
                    activeOpacity={0.7}
                    style={tw`p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                >
                    <Search size={17} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleTheme}
                    activeOpacity={0.7}
                    style={tw`p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                >
                    {isDark ? (
                        <Sun size={17} color="#c4b5fd" />
                    ) : (
                        <Moon size={17} color="#8b5cf6" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    activeOpacity={0.7}
                    style={tw`p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl relative shadow-sm`}
                >
                    <Bell size={17} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                    {unreadCount > 0 && (
                        <View style={tw`absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full items-center justify-center border-2 border-white dark:border-[#0B0A1F]`}>
                            <Text style={tw`text-[7px] font-black text-white`}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {user && (
                    <TouchableOpacity
                        onPress={() => handleNavigate({
                            stack: 'EmployeeStack',
                            route: 'EmployeeProfile',
                            params: { employeeId: user?.id }
                        })}
                        activeOpacity={0.8}
                        style={tw`w-8 h-8 rounded-xl bg-[#8b5cf6] border-2 border-white dark:border-[#8b5cf6]/40 items-center justify-center shadow-md ml-0.5`}
                    >
                        <Text style={tw`text-white font-black text-xs`}>
                            {userInitial}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Global Search Modal Overlay */}
            <Modal
                visible={showSearchModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowSearchModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={tw`flex-1 bg-black/80 px-4 pt-12 pb-6 justify-start`}>
                        <View style={tw`bg-white dark:bg-[#1c1335] rounded-[2rem] border border-gray-200 dark:border-[#6d28d9]/40 shadow-2xl overflow-hidden max-h-[85%]`}>
                            
                            {/* Search Bar Header */}
                            <View style={tw`flex-row items-center p-3 border-b border-gray-100 dark:border-[#6d28d9]/30 bg-gray-50 dark:bg-[#251052]`}>
                                <Search size={20} color="#8b5cf6" style={tw`ml-2 mr-3`} />
                                <TextInput
                                    style={tw`flex-1 text-base text-gray-900 dark:text-white h-11 font-semibold`}
                                    placeholder={isHrAdmin ? "Search employees or pages..." : "Search pages..."}
                                    placeholderTextColor="#a78bfa"
                                    autoFocus={true}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')} style={tw`p-2 mr-1`}>
                                        <X size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowSearchModal(false)}
                                    style={tw`px-3 py-1.5 bg-gray-200 dark:bg-white/10 rounded-xl`}
                                >
                                    <Text style={tw`text-xs font-bold text-gray-700 dark:text-purple-200`}>Close</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Search Results List */}
                            <ScrollView style={tw`p-4`} keyboardShouldPersistTaps="handled">
                                {searchQuery.trim() === '' ? (
                                    <View style={tw`py-8 items-center justify-center`}>
                                        <Search size={40} color="#8b5cf6" style={tw`opacity-40 mb-3`} />
                                        <Text style={tw`text-sm font-bold text-gray-700 dark:text-purple-200`}>Quick Navigation & Search</Text>
                                        <Text style={tw`text-xs text-gray-400 dark:text-purple-300/60 mt-1 text-center px-6`}>
                                            Type employee names, department, or pages like Attendance, Leave, Reports...
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* Pages Section */}
                                        {filteredNav.length > 0 && (
                                            <View style={tw`mb-5`}>
                                                <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#8b5cf6] dark:text-[#a78bfa] mb-2.5 ml-1`}>
                                                    PAGES & MODULES
                                                </Text>
                                                {filteredNav.map((item) => {
                                                    const IconComp = item.icon;
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.name}
                                                            onPress={() => handleNavigate(item)}
                                                            activeOpacity={0.7}
                                                            style={tw`flex-row items-center p-3 mb-2 rounded-2xl bg-gray-50 dark:bg-[#251052] border border-gray-100 dark:border-[#6d28d9]/20`}
                                                        >
                                                            <View style={tw`w-9 h-9 rounded-xl bg-[#8b5cf6]/15 items-center justify-center mr-3`}>
                                                                <IconComp size={18} color="#8b5cf6" />
                                                            </View>
                                                            <Text style={tw`text-sm font-bold text-gray-800 dark:text-white flex-1`}>
                                                                {item.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}

                                        {/* Employees Section */}
                                        {filteredEmployees.length > 0 && (
                                            <View style={tw`mb-4`}>
                                                <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#8b5cf6] dark:text-[#a78bfa] mb-2.5 ml-1`}>
                                                    EMPLOYEES
                                                </Text>
                                                {filteredEmployees.map((emp) => {
                                                    const initials = typeof emp?.name === 'string' && emp.name ? emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'E';
                                                    const title = (typeof emp?.employeeProfile?.title === 'string' && emp.employeeProfile.title) || (typeof emp?.role === 'string' && emp.role) || 'Employee';
                                                    return (
                                                        <TouchableOpacity
                                                            key={emp.id}
                                                            onPress={() => handleNavigate({
                                                                stack: 'EmployeeStack',
                                                                route: 'EmployeeProfile',
                                                                params: { employeeId: emp.id }
                                                            })}
                                                            activeOpacity={0.7}
                                                            style={tw`flex-row items-center p-3 mb-2 rounded-2xl bg-gray-50 dark:bg-[#251052] border border-gray-100 dark:border-[#6d28d9]/20`}
                                                        >
                                                            <View style={tw`w-9 h-9 rounded-xl bg-[#8b5cf6] items-center justify-center mr-3 shadow-sm`}>
                                                                <Text style={tw`text-white font-bold text-xs`}>{initials}</Text>
                                                            </View>
                                                            <View style={tw`flex-1 mr-2`}>
                                                                <Text style={tw`text-sm font-bold text-gray-800 dark:text-white`}>
                                                                    {emp.name}
                                                                </Text>
                                                                <Text style={tw`text-[10px] text-gray-400 dark:text-purple-300/70 font-semibold`}>
                                                                    {title} • {typeof emp?.email === 'string' ? emp.email : 'No email'}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}

                                        {/* No Results */}
                                        {filteredNav.length === 0 && filteredEmployees.length === 0 && (
                                            <View style={tw`py-10 items-center justify-center`}>
                                                <Text style={tw`text-sm font-bold text-gray-700 dark:text-white`}>No results found</Text>
                                                <Text style={tw`text-xs text-gray-400 mt-1`}>No pages or employees matched "{searchQuery}"</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </ScrollView>

                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
