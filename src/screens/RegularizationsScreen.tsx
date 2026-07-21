import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, RefreshControl, } from 'react-native';
import { Check, X, Search, Calendar, Clock, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import api from '../utils/api';
import tw from 'twrnc';
import useRegularizations from "../hooks/useRegularizations";
import { useToast } from '../context/ToastContext';

export default function RegularizationsScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    //const [submittingReject, setSubmittingReject] = useState(false);
    const insets = useSafeAreaInsets();
    const {
        loading,
        refreshing,
        requests,
        submitting,
        approve,
        reject,
        refresh,
        error,
    } = useRegularizations();

    // const fetchRequests = async () => {
    //     setLoading(true);
    //     try {
    //         const res = await api.get('/attendance/regularize/pending');
    //         setRequests(Array.isArray(res.data) ? res.data : []);
    //     } catch (error: any) {
    //         console.error('Error fetching regularizations:', error);
    //         Alert.alert('Error', error.response?.data?.message || 'Failed to load regularizations');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchRequests();
    // }, []);

    const handleApprove = async (id: string) => {
        try {
            await approve(id);
            showToast("Attendance correction approved successfully.", 'success');
        } catch (err: any) {
            showToast(err.message || "Failed to approve regularization", 'error');
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectingId || !rejectComment.trim()) {
            showToast("Please enter a rejection reason.", 'error');
            return;
        }

        try {
            await reject(
                rejectingId,
                rejectComment
            );
            showToast("Attendance correction rejected.", 'success');
            setRejectComment("");
            setRejectingId(null);
        } catch (err: any) {
            showToast(err.message || "Failed to reject regularization", 'error');
        }
    };

    const filteredRequests = requests.filter(req => {
        const name = req.user?.name || '';
        const reason = req.reason || '';
        const title = req.user?.employeeProfile?.title || '';

        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
            title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>

            {/* Header */}
            <View style={[
                tw`flex-row items-center px-4 pb-4 bg-white dark:bg-[#4c1d95] border-b border-gray-100 dark:border-[#8b5cf6]/30`,
                { paddingTop: insets.top + 16 }
            ]}>
                {navigation.canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                        <ArrowLeft size={20} color="#1e293b" />
                    </TouchableOpacity>
                )}
                <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Attendance Corrections</Text>
            </View>

            {/* Search Bar */}
            <View style={tw`px-4 pt-4`}>
                <View style={tw`flex-row items-center bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-[#8b5cf6]/30 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                        placeholder="Search corrections..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : filteredRequests.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Calendar size={48} color="#cbd5e1" style={tw`mb-4`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Pending Corrections</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>All requests have been processed successfully.</Text>
                </View>
            ) : (
                <ScrollView
                    style={tw`flex-grow px-4`}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                        />
                    }
                >
                    {filteredRequests.map((req) => {
                        const name = req.user?.name || `Employee #${req.userId}`;
                        const title = req.user?.employeeProfile?.title || 'Employee';

                        return (
                            <View
                                key={req.id}
                                style={tw`bg-white dark:bg-[#4c1d95] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-[#8b5cf6]/30 shadow-sm`}
                            >
                                <View style={tw`flex-row justify-between mb-3`}>
                                    <View>
                                        <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{name}</Text>
                                        <Text style={tw`text-[10px] text-gray-400 font-bold uppercase mt-0.5`}>{title}</Text>
                                    </View>
                                    <View style={tw`items-end`}>
                                        <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>{req.date}</Text>
                                    </View>
                                </View>

                                {/* Proposed In/Out times */}
                                <View style={tw`flex-row gap-4 mb-3`}>
                                    {!!req.proposedIn && (
                                        <View style={tw`flex-row items-center gap-1`}>
                                            <Clock size={12} color="#10b981" />
                                            <Text style={tw`text-xs font-bold text-green-600`}>In: {req.proposedIn}</Text>
                                        </View>
                                    )}
                                    {!!req.proposedOut && (
                                        <View style={tw`flex-row items-center gap-1`}>
                                            <Clock size={12} color="#f43f5e" />
                                            <Text style={tw`text-xs font-bold text-rose-500`}>Out: {req.proposedOut}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={tw`text-xs text-gray-655 dark:text-gray-300 italic mb-4`}>
                                    "{req.reason}"
                                </Text>

                                {/* Approve / Reject Actions */}
                                <View style={tw`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => handleApprove(req.id)}
                                        style={tw`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 bg-green-50 dark:bg-green-950/20 rounded-xl`}
                                    >
                                        <Check size={16} color="#10b981" />
                                        <Text style={tw`text-xs font-bold text-green-600`}>Approve</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            setRejectingId(req.id);
                                            setRejectComment('');
                                        }}
                                        style={tw`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 bg-rose-50 dark:bg-rose-955/20 rounded-xl`}
                                    >
                                        <X size={16} color="#f43f5e" />
                                        <Text style={tw`text-xs font-bold text-rose-500`}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Rejection Comment Modal */}
            <Modal
                visible={!!rejectingId}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRejectingId(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-t-3xl border-t border-gray-200 dark:border-[#8b5cf6]/30`}>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-2`}>Reject Request</Text>
                        <Text style={tw`text-xs text-gray-500 mb-4`}>Please provide a reason for rejecting this regularization request.</Text>

                        <TextInput
                            style={tw`w-full px-4 py-3 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white min-h-20 mb-6`}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor="#cbd5e1"
                            multiline={true}
                            value={rejectComment}
                            onChangeText={setRejectComment}
                        />

                        <View style={tw`flex-row gap-4`}>
                            <TouchableOpacity
                                onPress={() => setRejectingId(null)}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
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


