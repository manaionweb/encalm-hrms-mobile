import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';

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

import CustomDrawerContent from './CustomDrawerContent';

// Stack Navigator for Auth
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="SignIn" component={SignInScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
    );
}

// Stack Navigator for Employees sub-flow
const EmployeeStack = createNativeStackNavigator();

function EmployeeStackNavigator() {
    return (
        <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
            <EmployeeStack.Screen name="EmployeeList" component={EmployeeListScreen} />
            <EmployeeStack.Screen name="AddEmployee" component={AddEmployeeScreen} />
            <EmployeeStack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} />
            <EmployeeStack.Screen name="Regularizations" component={RegularizationsScreen} />
        </EmployeeStack.Navigator>
    );
}

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
                    backgroundColor: '#fff',
                    width: 260,
                }
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardHomeScreen} />
            
            {/* Conditional screens based on role permissions */}
            <Drawer.Screen name="Attendance" component={AttendanceScreen} />
            
            <Drawer.Screen 
                name="EmployeeStack" 
                component={EmployeeStackNavigator} 
            />

            <Drawer.Screen name="Team" component={TeamScreen} />
            <Drawer.Screen name="Leave" component={LeaveScreen} />
            
            {isAdmin && (
                <>
                    <Drawer.Screen name="Reports" component={ReportsScreen} />
                    <Drawer.Screen name="Masters" component={MastersScreen} />
                    <Drawer.Screen name="Logs" component={LogFileScreen} />
                </>
            )}

            <Drawer.Screen name="Notifications" component={NotificationsScreen} />
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
                <RootStack.Screen name="Main" component={MainDrawerNavigator} />
            )}
        </RootStack.Navigator>
    );
}
