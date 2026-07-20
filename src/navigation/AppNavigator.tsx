import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import Screens
import SignInScreen from '../screens/SignInScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import AddEmployeeScreen from '../screens/AddEmployeeScreen';
import EmployeeProfileScreen from '../screens/EmployeeProfileScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import RegularizationsScreen from '../screens/RegularizationsScreen';
import LeaveScreen from '../screens/LeaveScreen';
import TeamScreen from '../screens/TeamScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MastersScreen from '../screens/MastersScreen';
import LogFileScreen from '../screens/LogFileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LeaveTodayScreen from '../screens/LeaveTodayScreen';
import NewJoinersScreen from '../screens/NewJoinersScreen';

import CustomDrawerContent from './CustomDrawerContent';

// Higher-Order Component to force screen re-renders when theme changes
function withTheme(Component: React.ComponentType<any>) {
    return function ThemedComponent(props: any) {
        const { theme } = useTheme();
        return <Component {...props} theme={theme} />;
    };
}

// Wrap all screens with HOC
const ThemedSignIn = withTheme(SignInScreen);
const ThemedForgotPassword = withTheme(ForgotPasswordScreen);
const ThemedDashboard = withTheme(DashboardHomeScreen);
const ThemedEmployeeList = withTheme(EmployeeListScreen);
const ThemedAddEmployee = withTheme(AddEmployeeScreen);
const ThemedEmployeeProfile = withTheme(EmployeeProfileScreen);
const ThemedAttendance = withTheme(AttendanceScreen);
const ThemedRegularizations = withTheme(RegularizationsScreen);
const ThemedLeave = withTheme(LeaveScreen);
const ThemedTeam = withTheme(TeamScreen);
const ThemedReports = withTheme(ReportsScreen);
const ThemedMasters = withTheme(MastersScreen);
const ThemedLogs = withTheme(LogFileScreen);
const ThemedNotifications = withTheme(NotificationsScreen);
const ThemedLeaveToday = withTheme(LeaveTodayScreen);
const ThemedNewJoiners = withTheme(NewJoinersScreen);

// Stack Navigator for Auth
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="SignIn" component={ThemedSignIn} />
            <AuthStack.Screen name="ForgotPassword" component={ThemedForgotPassword} />
        </AuthStack.Navigator>
    );
}

// Stack Navigator for Employees sub-flow
const EmployeeStack = createNativeStackNavigator();

function EmployeeStackNavigator() {
    return (
        <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
            <EmployeeStack.Screen name="EmployeeList" component={ThemedEmployeeList} />
            <EmployeeStack.Screen name="AddEmployee" component={ThemedAddEmployee} />
            <EmployeeStack.Screen name="EmployeeProfile" component={ThemedEmployeeProfile} />
            <EmployeeStack.Screen name="Regularizations" component={ThemedRegularizations} />
        </EmployeeStack.Navigator>
    );
}

const ThemedEmployeeStackNavigator = withTheme(EmployeeStackNavigator);

// Drawer Navigator for Main Application Shell
const Drawer = createDrawerNavigator();

function MainDrawerNavigator() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: '#1e1b4b',
                    width: 260,
                }
            }}
        >
            <Drawer.Screen name="Dashboard" component={ThemedDashboard} />

            {/* Conditional screens based on role permissions */}
            <Drawer.Screen name="Attendance" component={ThemedAttendance} />

            <Drawer.Screen
                name="EmployeeStack"
                component={ThemedEmployeeStackNavigator}
            />

            <Drawer.Screen name="Team" component={ThemedTeam} />
            <Drawer.Screen name="Leave" component={ThemedLeave} />

            {isAdmin && (
                <>
                    <Drawer.Screen name="Reports" component={ThemedReports} />
                    <Drawer.Screen name="Masters" component={ThemedMasters} />
                    <Drawer.Screen name="Logs" component={ThemedLogs} />
                </>
            )}

            <Drawer.Screen name="Notifications" component={ThemedNotifications} />
        </Drawer.Navigator>
    );
}

// Root Switch Navigator
const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null; // Let the main App render its loader
    }

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            ) : (
                <>
                    <RootStack.Screen name="Main" component={MainDrawerNavigator} />
                    <RootStack.Screen name="LeaveToday" component={ThemedLeaveToday} />
                    <RootStack.Screen name="NewJoiners" component={ThemedNewJoiners} />
                </>
            )}
        </RootStack.Navigator>
    );
}
