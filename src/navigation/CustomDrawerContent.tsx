import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Users, UsersRound, LogOut, 
    Fingerprint, Settings2, FileText, CalendarRange, UserCircle
} from 'lucide-react-native';
import tw from 'twrnc';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    // Accessible modules based on role (mirroring Web Sidebar)
    const canAccess = (moduleName: string) => {
        if (!user) return false;
        if (isAdmin) return true; // Admins access all
        
        let userModules = user.accessibleModules || [];
        if (userModules.length === 0) {
            userModules = ['DASHBOARD', 'ATTENDANCE', 'LEAVE', 'MY_PROFILE'];
        }
        return userModules.includes(moduleName);
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: async () => await logout() }
            ]
        );
    };

    // Define navigation drawer menu entries
    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, route: 'Dashboard', module: 'DASHBOARD' },
        { label: 'My Attendance', icon: Fingerprint, route: 'Attendance', module: 'ATTENDANCE' },
        { 
            label: 'Employees', 
            icon: Users, 
            route: 'EmployeeStack', 
            module: 'EMPLOYEE',
            params: { screen: 'EmployeeList' }
        },
        { label: 'Team', icon: UsersRound, route: 'Team', module: 'TEAM' },
        { label: 'Leave', icon: CalendarRange, route: 'Leave', module: 'LEAVE' },
        { label: 'Reports', icon: FileText, route: 'Reports', module: 'REPORTS' },
        { label: 'Masters', icon: Settings2, route: 'Masters', module: 'MASTERS' },
        { label: 'Logs', icon: FileText, route: 'Logs', module: 'TASK' },
        { 
            label: 'My Profile', 
            icon: UserCircle, 
            route: 'EmployeeStack', 
            module: 'MY_PROFILE',
            params: { 
                screen: 'EmployeeProfile', 
                params: { employeeId: user?.id, isSelf: true } 
            }
        }
    ];

    // Find the current active route name
    const activeRouteName = props.state.routeNames[props.state.index];

    return (
        <View style={tw`flex-1 bg-white dark:bg-slate-900`}>
            
            {/* User Profile Header */}
            <View style={tw`p-6 bg-indigo-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 pt-12`}>
                <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center`}>
                        <Text style={tw`text-white font-black text-lg`}>
                            {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-black text-sm text-gray-900 dark:text-white`} numberOfLines={1}>
                            {user?.name || 'User'}
                        </Text>
                        <Text style={tw`text-[11px] text-gray-400 dark:text-gray-400 font-medium mt-0.5`} numberOfLines={1}>
                            {user?.email || ''}
                        </Text>
                        <View style={tw`px-2 py-0.5 bg-indigo-600/10 self-start rounded-full mt-1.5`}>
                            <Text style={tw`text-[9px] font-bold text-indigo-600 dark:text-indigo-400`}>
                                {user?.role === 'HR_ADMIN' ? 'HR ADMIN' : 'EMPLOYEE'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Menu Items List */}
            <DrawerContentScrollView {...props} contentContainerStyle={tw`pt-2`}>
                {menuItems.map((item, index) => {
                    if (!canAccess(item.module)) return null;

                    // Compute active state based on route
                    const isActive = activeRouteName === item.route;

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => props.navigation.navigate(item.route, item.params)}
                            style={tw`flex-row items-center justify-between px-5 py-3.5 mx-3 my-0.5 rounded-2xl ${isActive ? 'bg-indigo-600' : 'bg-transparent'}`}
                        >
                            <View style={tw`flex-row items-center gap-3.5`}>
                                <item.icon size={20} color={isActive ? '#ffffff' : '#64748b'} />
                                <Text style={tw`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {item.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            {/* Logout Trigger */}
            <View style={tw`p-5 border-t border-gray-100 dark:border-slate-800`}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={tw`flex-row items-center gap-3 px-5 py-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl`}
                >
                    <LogOut size={20} color="#ef4444" />
                    <Text style={tw`text-xs font-bold text-rose-600 dark:text-rose-400`}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}
