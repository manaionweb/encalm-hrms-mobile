import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { Calendar, Plus, Check, X } from 'lucide-react-native';
//import api from '../utils/api';
import useLeave from "../hooks/useLeave";
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import { useRoute } from "@react-navigation/native";

export default function LeaveScreen({ navigation }: any) {
    const { user } = useAuth();
    const route = useRoute<any>();
    const isHrAdmin = user?.role === 'HR_ADMIN';
    const {

        loading,

        submitting,

        error,

        leaveBalances,

        leaveHistory,

        allLeaves,

        holidays,

        apply,

        approve,

        reject,

        refresh,

    } = useLeave();

    const [activeTab, setActiveTab] =
        useState<'MY_LEAVE' | 'APPROVALS'>(
            route.params?.activeTab ?? 'MY_LEAVE'
        );
    // const [loading, setLoading] = useState(true);
    // const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    // const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    // const [allLeaves, setAllLeaves] = useState<any[]>([]);
    // const [holidays, setHolidays] = useState<any[]>([]);

    // Form Apply Leave
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveType, setLeaveType] = useState('CL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    // const [submitting, setSubmitting] = useState(false);

    // Rejection State
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    //const [submittingReject, setSubmittingReject] = useState(false);

    // const fetchData = async () => {
    //     setLoading(true);
    //     try {
    //         const [balancesRes, historyRes, holidaysRes] = await Promise.all([
    //             api.get('/leave/balances'),
    //             api.get('/leave/history'),
    //             api.get('/masters/holidays')
    //         ]);
    //         setLeaveBalances(balancesRes.data || []);
    //         setLeaveHistory(historyRes.data || []);
    //         setHolidays(holidaysRes.data || []);

    //         if (isHrAdmin) {
    //             const allRes = await api.get('/leave/history?all=true');
    //             setAllLeaves(allRes.data || []);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching leave data:', error);
    //         Alert.alert('Error', 'Failed to load leave records');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchData();
    // }, [isHrAdmin]);

    useEffect(() => {

        if (route.params?.activeTab) {

            setActiveTab(route.params.activeTab);

        }

    }, [route.params]);

    const handleApplyLeave = async () => {

        if (!fromDate || !toDate || !reason.trim()) {

            Alert.alert(
                "Error",
                "Please fill in all fields."
            );

            return;

        }

        try {

            await apply({

                leaveTypeCode: leaveType,

                startDate: fromDate,

                endDate: toDate,

                reason,

            });

            Alert.alert(
                "Success",
                "Leave application submitted!"
            );

            setShowApplyModal(false);

            setLeaveType("CL");

            setFromDate("");

            setToDate("");

            setReason("");


        } catch (err: any) {

            Alert.alert(
                "Error",
                err.message
            );

        }

    };
    const handleApprove = async (
        leaveId: number
    ) => {

        try {

            await approve(leaveId);

            Alert.alert(
                "Success",
                "Leave approved successfully."
            );

        }

        catch (err: any) {

            Alert.alert(
                "Error",
                err.message
            );

        }

    };

    const handleRejectSubmit = async () => {

        if (!rejectingId || !rejectComment.trim()) {

            Alert.alert(
                "Error",
                "Please enter rejection reason."
            );

            return;
        }

        try {

            await reject(
                rejectingId,
                rejectComment
            );

            Alert.alert(
                "Success",
                "Leave rejected."
            );

            setRejectComment("");
            setRejectingId(null);

        } catch (err: any) {

            Alert.alert(
                "Error",
                err.message
            );

        }

    };

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>

            <CustomHeader navigation={navigation} title="Leave Manager" />

            {/* Role Switcher tabs */}
            {isHrAdmin && (
                <View style={tw`flex-row bg-white dark:bg-slate-800 p-2 border-b border-gray-100 dark:border-slate-700`}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('MY_LEAVE')}
                        style={tw`flex-1 py-2 items-center ${activeTab === 'MY_LEAVE' ? 'border-b-2 border-indigo-600' : ''}`}
                    >
                        <Text style={tw`text-xs font-bold ${activeTab === 'MY_LEAVE' ? 'text-indigo-600' : 'text-gray-400'}`}>My Leave</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('APPROVALS')}
                        style={tw`flex-1 py-2 items-center ${activeTab === 'APPROVALS' ? 'border-b-2 border-indigo-600' : ''}`}
                    >
                        <Text style={tw`text-xs font-bold ${activeTab === 'APPROVALS' ? 'text-indigo-600' : 'text-gray-400'}`}>Approvals</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <ScrollView style={tw`flex-1 p-4`} contentContainerStyle={tw`pb-12`}>

                    {activeTab === 'MY_LEAVE' ? (
                        <View>

                            {/* Inline Apply trigger */}
                            <TouchableOpacity
                                onPress={() => setShowApplyModal(true)}
                                style={tw`flex-row items-center justify-center gap-2 p-4 bg-indigo-50 dark:bg-slate-800 border border-dashed border-indigo-300 dark:border-slate-700 rounded-3xl mb-6`}
                            >
                                <Plus size={18} color="#4f46e5" />
                                <Text style={tw`text-indigo-650 dark:text-indigo-400 font-bold text-xs`}>Apply For Time Off</Text>
                            </TouchableOpacity>

                            {/* Leave Balances Grid */}
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Available Balances</Text>
                            <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                                {leaveBalances.map((balance, index) => (
                                    <View key={balance.code || balance.leaveTypeCode || index} style={tw`w-[47%] bg-white dark:bg-slate-800 p-4 rounded-3xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm`}>
                                        <Text style={tw`text-xs font-bold text-gray-450 uppercase`}>
                                            {balance.name || balance.leaveType?.name || balance.code || balance.leaveTypeCode}
                                        </Text>
                                        <Text style={tw`text-2xl font-black text-gray-900 dark:text-white mt-1`}>
                                            {balance.balance}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Leaves History */}
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Leave Request History</Text>
                            <View style={tw`bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm`}>
                                {leaveHistory.length === 0 ? (
                                    <Text style={tw`text-center py-6 text-gray-400`}>No leave requests recorded.</Text>
                                ) : (
                                    leaveHistory.map((leave) => (
                                        <View key={leave.id} style={tw`py-3 border-b border-gray-50 dark:border-slate-700 last:border-0`}>
                                            <View style={tw`flex-row justify-between`}>
                                                <View>
                                                    <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>
                                                        {leave.leaveType?.code || 'Leave'} Application
                                                    </Text>
                                                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                        {leave.startDate} to {leave.endDate}
                                                    </Text>
                                                </View>
                                                <View style={tw`px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 justify-center`}>
                                                    <Text style={tw`text-[9px] font-bold text-gray-600 dark:text-gray-300`}>
                                                        {leave.status}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>
                    ) : (

                        /* Approvals view for HR Admin */
                        <View>
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Pending Leave Approvals</Text>
                            {allLeaves.filter(l => l.status === 'PENDING').length === 0 ? (
                                <Text style={tw`text-center py-10 text-gray-400`}>No pending leave approvals.</Text>
                            ) : (
                                allLeaves
                                    .filter((leave) => leave.status === "PENDING")
                                    .map((leave) => {
                                        const name = leave.user?.name || `Employee #${leave.userId}`;
                                        return (
                                            <View
                                                key={leave.id}
                                                style={tw`bg-white dark:bg-slate-800 p-4 rounded-3xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm`}
                                            >
                                                <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{name}</Text>
                                                <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                    Type: {leave.leaveType?.code} • Date: {leave.startDate} to {leave.endDate}
                                                </Text>
                                                <Text style={tw`text-xs text-gray-500 italic my-3`}>
                                                    "{leave.reason}"
                                                </Text>

                                                <View style={tw`flex-row gap-3`}>
                                                    <TouchableOpacity
                                                        onPress={() => handleApprove(leave.id)}
                                                        style={tw`flex-1 py-2 bg-green-50 rounded-xl items-center flex-row justify-center gap-1`}
                                                    >
                                                        <Check size={16} color="#10b981" />
                                                        <Text style={tw`text-xs font-bold text-green-600`}>Approve</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setRejectingId(leave.id);
                                                            setRejectComment('');
                                                        }}
                                                        style={tw`flex-1 py-2 bg-rose-50 rounded-xl items-center flex-row justify-center gap-1`}
                                                    >
                                                        <X size={16} color="#f43f5e" />
                                                        <Text style={tw`text-xs font-bold text-rose-500`}>Reject</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })
                            )}
                        </View>
                    )}

                </ScrollView>
            )}

            {/* Apply Leave Modal */}
            <Modal
                visible={showApplyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowApplyModal(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={tw`bg-white dark:bg-slate-800 p-6 rounded-t-3xl border-t border-gray-200 dark:border-slate-700`}>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>Apply for Leave</Text>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Leave Type (CL, SL, EL)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-805`}
                                value={leaveType}
                                onChangeText={setLeaveType}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Start Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-805`}
                                placeholder="e.g. 2026-07-15"
                                value={fromDate}
                                onChangeText={setFromDate}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>End Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-805`}
                                placeholder="e.g. 2026-07-16"
                                value={toDate}
                                onChangeText={setToDate}
                            />
                        </View>

                        <View style={tw`mb-6`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Reason for leave *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-805`}
                                placeholder="Personal emergency..."
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>

                        <View style={tw`flex-row gap-4`}>
                            <TouchableOpacity
                                onPress={() => {

                                    setShowApplyModal(false);

                                    setLeaveType("CL");

                                    setFromDate("");

                                    setToDate("");

                                    setReason("");

                                }}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 rounded-xl items-center`}
                            >
                                <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleApplyLeave}
                                disabled={submitting}
                                style={tw`flex-1 py-3.5 bg-indigo-600 rounded-xl items-center`}
                            >
                                <Text style={tw`text-white font-bold`}>
                                    {submitting ? 'Applying...' : 'Apply'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Rejection comment modal for Admin */}
            <Modal
                visible={!!rejectingId}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRejectingId(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={tw`bg-white dark:bg-slate-800 p-6 rounded-t-3xl border-t border-gray-200 dark:border-slate-700`}>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-2`}>Reject Leave Application</Text>
                        <Text style={tw`text-xs text-gray-500 mb-4`}>Please provide a reason for rejecting this leave request.</Text>

                        <TextInput
                            style={tw`w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-800 dark:text-white min-h-20 mb-6`}
                            placeholder="Reason for rejection..."
                            placeholderTextColor="#cbd5e1"
                            multiline={true}
                            value={rejectComment}
                            onChangeText={setRejectComment}
                        />

                        <View style={tw`flex-row gap-4`}>
                            <TouchableOpacity
                                onPress={() => setRejectingId(null)}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 rounded-xl items-center`}
                            >
                                <Text style={tw`text-gray-655 dark:text-gray-300 font-bold`}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleRejectSubmit}
                                disabled={submitting}
                                style={tw`flex-1 py-3.5 bg-rose-500 rounded-xl items-center`}
                            >
                                <Text style={tw`text-white font-bold`}>
                                    {submitting ? 'Rejecting...' : 'Reject'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
