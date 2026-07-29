import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Users, UsersRound, LogOut, 
    Fingerprint, Settings2, FileText, CalendarRange, UserCircle,
    ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react-native';
import tw from 'twrnc';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    const [isEmployeeExpanded, setIsEmployeeExpanded] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const employeeSubItems = [
        { label: 'List', route: 'EmployeeStack', params: { screen: 'EmployeeList' } },
        { label: 'Leave Approval', route: 'Leave', params: { activeTab: 'APPROVALS' } },
        { label: 'Regularizations', route: 'EmployeeStack', params: { screen: 'Regularizations' } }
    ];

    const isSubItemActive = (subRoute: string, subParams?: any) => {
        const activeRoute = props.state.routes[props.state.index];
        const activeRouteName = activeRoute.name;

        if (activeRouteName !== subRoute) return false;

        if (subRoute === 'Leave') {
            const currentTab = (activeRoute.params as any)?.activeTab;
            return currentTab === subParams?.activeTab;
        }

        if (subRoute === 'EmployeeStack') {
            const stateRoutes = (activeRoute.state as any)?.routes;
            const stateIndex = (activeRoute.state as any)?.index;
            const nestedScreenName = stateRoutes && typeof stateIndex === 'number'
                ? stateRoutes[stateIndex].name 
                : (activeRoute.params as any)?.screen;
            return nestedScreenName === subParams?.screen;
        }

        return true;
    };

    React.useEffect(() => {
        const activeRoute = props.state.routes[props.state.index];
        if (activeRoute.name === 'EmployeeStack') {
            setIsEmployeeExpanded(true);
        } else if (activeRoute.name === 'Leave' && (activeRoute.params as any)?.activeTab === 'APPROVALS') {
            setIsEmployeeExpanded(true);
        }
    }, [props.state.index]);

    // Accessible modules based on role (mirroring Web Sidebar)
    const canAccess = (moduleName: string) => {
        if (!user) return false;
        if (isAdmin) return true; // Admins access all
        
        const employeeDefaultModules = ['DASHBOARD', 'ATTENDANCE', 'LEAVE', 'MY_PROFILE'];
        const userModules = Array.from(new Set([
            ...employeeDefaultModules,
            ...(user.accessibleModules || [])
        ]));
        return userModules.includes(moduleName);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
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
        <View style={tw`flex-1 bg-[#1e1b4b]`}>
            
            {/* User Profile Header */}
            <View style={tw`p-6 bg-[#16143c] border-b border-white/5 pt-12`}>
                <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-12 h-12 rounded-2xl bg-[#8b5cf6] items-center justify-center`}>
                        <Text style={tw`text-white font-black text-lg`}>
                            {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-black text-sm text-white`} numberOfLines={1}>
                            {user?.name || 'User'}
                        </Text>
                        <Text style={tw`text-[11px] text-slate-400 font-medium mt-0.5`} numberOfLines={1}>
                            {user?.email || ''}
                        </Text>
                        <View style={tw`px-2 py-0.5 bg-white/10 self-start rounded-full mt-1.5`}>
                            <Text style={tw`text-[9px] font-bold text-[#c4b5fd]`}>
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

                    // If it is 'Employees', render it with toggle behavior and chevron
                    if (item.label === 'Employees') {
                        return (
                            <View key={index}>
                                <TouchableOpacity
                                    onPress={() => setIsEmployeeExpanded(!isEmployeeExpanded)}
                                    style={tw`flex-row items-center justify-between px-5 py-3.5 mx-3 my-0.5 rounded-2xl bg-transparent`}
                                >
                                    <View style={tw`flex-row items-center gap-3.5`}>
                                        <item.icon size={20} color="#94a3b8" />
                                        <Text style={tw`text-xs font-bold text-slate-300`}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    {isEmployeeExpanded ? (
                                        <ChevronUp size={16} color="#94a3b8" />
                                    ) : (
                                        <ChevronDown size={16} color="#94a3b8" />
                                    )}
                                </TouchableOpacity>
                                
                                {isEmployeeExpanded && (
                                    <View style={tw`pl-6 mb-2`}>
                                        {employeeSubItems.map((sub, subIdx) => {
                                            const isSubActive = isSubItemActive(sub.route, sub.params);
                                            return (
                                                <TouchableOpacity
                                                    key={subIdx}
                                                    onPress={() => props.navigation.navigate(sub.route, sub.params)}
                                                    style={tw`flex-row items-center px-5 py-2.5 my-0.5 mr-3 rounded-xl ${isSubActive ? 'bg-[#8b5cf6]/20 border-l-2 border-[#8b5cf6]' : 'bg-transparent'}`}
                                                >
                                                    <View style={tw`w-1.5 h-1.5 rounded-full mr-3.5 ${isSubActive ? 'bg-[#c4b5fd]' : 'bg-slate-400'}`} />
                                                    <Text style={tw`text-[11px] font-bold ${isSubActive ? 'text-white' : 'text-slate-400'}`}>
                                                        {sub.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    }

                    // Compute active state based on route (exclude EmployeeStack since sub-items handle highlight)
                    const isActive = activeRouteName === item.route && item.route !== 'EmployeeStack';

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => props.navigation.navigate(item.route, item.params)}
                            style={tw`flex-row items-center justify-between px-5 py-3.5 mx-3 my-0.5 rounded-2xl ${isActive ? 'bg-[#8b5cf6]' : 'bg-transparent'}`}
                        >
                            <View style={tw`flex-row items-center gap-3.5`}>
                                <item.icon size={20} color={isActive ? '#ffffff' : '#94a3b8'} />
                                <Text style={tw`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {item.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            {/* Logout Trigger */}
            <View style={tw`p-5 border-t border-white/5`}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={tw`flex-row items-center gap-3 px-5 py-3.5 bg-rose-500/10 rounded-2xl`}
                >
                    <LogOut size={20} color="#f87171" />
                    <Text style={tw`text-xs font-bold text-rose-400`}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Custom Logout Confirmation Modal (Matching Web App) */}
            <Modal
                visible={showLogoutConfirm}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLogoutConfirm(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowLogoutConfirm(false)}
                    style={tw`flex-1 bg-black/65 items-center justify-center p-5`}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={tw`w-full max-w-sm bg-white dark:bg-[#181537] rounded-[2rem] p-7 border border-gray-100 dark:border-white/10 shadow-2xl items-center`}
                    >
                        {/* Red Circle Alert Icon */}
                        <View style={tw`w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full items-center justify-center mb-5`}>
                            <AlertCircle size={32} color="#ef4444" />
                        </View>

                        {/* Title */}
                        <Text style={tw`text-xl font-bold text-gray-800 dark:text-white mb-2 text-center`}>
                            Confirm Logout
                        </Text>

                        {/* Description */}
                        <Text style={tw`text-sm text-gray-500 dark:text-gray-400 text-center mb-7 leading-5`}>
                            Are you sure you want to log out of your session? You will need to sign in again to access your dashboard.
                        </Text>

                        {/* Action Buttons */}
                        <View style={tw`w-full gap-y-3`}>
                            <TouchableOpacity
                                onPress={async () => {
                                    setShowLogoutConfirm(false);
                                    await logout();
                                }}
                                style={tw`w-full py-3.5 bg-red-600 rounded-2xl items-center justify-center shadow-lg shadow-red-500/30 active:opacity-90`}
                            >
                                <Text style={tw`text-white font-bold text-sm`}>
                                    Yes, Logout
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowLogoutConfirm(false)}
                                style={tw`w-full py-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl items-center justify-center active:opacity-90`}
                            >
                                <Text style={tw`text-gray-600 dark:text-gray-300 font-bold text-sm`}>
                                    Keep me logged in
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </View>
    );
}
