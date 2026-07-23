import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Users, Plus, MoreVertical, Briefcase, UserPlus, X, Trash2, Check } from 'lucide-react-native';
import { 
    getTeams, 
    createTeam as createTeamApi, 
    addMembers, 
    removeMember, 
    deleteTeam, 
    updateTeam,
    getTeamAccessControl,
    saveTeamAccessControl
} from '../utils/teamApi';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import { useToast } from '../context/ToastContext';

export default function TeamScreen({ navigation }: any) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Team states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDesc, setNewTeamDesc] = useState('');

    // Active Team for actions/roster/adding
    const [activeTeam, setActiveTeam] = useState<any | null>(null);

    // Option menu bottom sheet
    const [showOptionsSheet, setShowOptionsSheet] = useState(false);

    // Edit Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamDesc, setEditTeamDesc] = useState('');

    // Access Control states
    const [showAccessControlModal, setShowAccessControlModal] = useState(false);
    const [permissions, setPermissions] = useState({
        list: true,
        attendance: true,
        leaveApproval: true,
        regularization: true
    });

    // Delete confirmation states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Team Roster states
    const [showRosterModal, setShowRosterModal] = useState(false);

    // Add Member states
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
    const [confirmRemoveEmployeeId, setConfirmRemoveEmployeeId] = useState<number | null>(null);
    const [memberSearchText, setMemberSearchText] = useState('');

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await getTeams();
            setTeams(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employee');
            setEmployees(res.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchEmployees();
    }, []);

    const handleProceedToMembers = () => {
        if (!newTeamName.trim()) {
            showToast("Please provide a team name.", 'error');
            return;
        }
        setShowCreateModal(false);
        // Reset member selection state
        setSelectedEmployees([]);
        setSelectedManagerId(null);
        setActiveTeam(null); // Indicates new team creation context
        setShowAddMemberModal(true);
    };

    const handleSaveMembers = async () => {
        try {
            if (activeTeam) {
                // Updating members of an existing team
                await addMembers(activeTeam.id, {
                    members: selectedEmployees,
                    managerId: selectedManagerId
                });
                showToast("Team roster updated successfully!", 'success');
            } else {
                // Creating team + adding members
                const res = await createTeamApi({ name: newTeamName, description: newTeamDesc });
                if (res.data && res.data.id) {
                    await addMembers(res.data.id, {
                        members: selectedEmployees,
                        managerId: selectedManagerId
                    });
                }
                showToast("Team created successfully!", 'success');
                setNewTeamName('');
                setNewTeamDesc('');
            }
            setShowAddMemberModal(false);
            setSelectedEmployees([]);
            setSelectedManagerId(null);
            setMemberSearchText('');
            fetchTeams();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to save team members.", 'error');
        }
    };

    const handleOpenAccessControl = async (team: any) => {
        setActiveTeam(team);
        setShowOptionsSheet(false);
        try {
            const res = await getTeamAccessControl(team.id);
            setPermissions(res.data || {
                list: true,
                attendance: true,
                leaveApproval: true,
                regularization: true
            });
        } catch (e) {
            setPermissions({
                list: true,
                attendance: true,
                leaveApproval: true,
                regularization: true
            });
        }
        setShowAccessControlModal(true);
    };

    const handleSaveAccessControl = async () => {
        if (!activeTeam) return;
        try {
            await saveTeamAccessControl(activeTeam.id, permissions);
            showToast("Access control updated successfully!", 'success');
            setShowAccessControlModal(false);
            fetchTeams();
        } catch (e) {
            console.error(e);
            showToast("Failed to save access control permissions.", 'error');
        }
    };

    const handleEditTeam = async () => {
        if (!activeTeam) return;
        if (!editTeamName.trim()) {
            showToast("Please provide a team name.", 'error');
            return;
        }
        try {
            await updateTeam(activeTeam.id, {
                name: editTeamName,
                description: editTeamDesc
            });
            showToast("Team updated successfully!", 'success');
            setShowEditModal(false);
            fetchTeams();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to update team.", 'error');
        }
    };

    const handleDeleteTeam = async () => {
        if (!activeTeam) return;
        try {
            await deleteTeam(activeTeam.id);
            showToast("Team deleted successfully!", 'success');
            setShowDeleteConfirm(false);
            fetchTeams();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to delete team.", 'error');
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        if (!activeTeam) return;
        try {
            await removeMember(activeTeam.id, memberId);
            const res = await getTeams();
            const updatedTeams = res.data || [];
            setTeams(updatedTeams);
            const freshActive = updatedTeams.find((t: any) => t.id === activeTeam.id);
            if (freshActive) {
                setActiveTeam(freshActive);
            } else {
                setShowRosterModal(false);
            }
            setConfirmRemoveEmployeeId(null);
        } catch (err) {
            console.error(err);
            showToast("Failed to remove member.", 'error');
        }
    };

    const handleToggleManager = (empId: number) => {
        if (selectedManagerId === empId) {
            setSelectedManagerId(null);
        } else {
            setSelectedManagerId(empId);
            // Ensure manager is also a member
            if (!selectedEmployees.includes(empId)) {
                setSelectedEmployees(prev => [...prev, empId]);
            }
        }
    };

    const filteredEmployees = employees.filter((emp: any) => 
        emp.name.toLowerCase().includes(memberSearchText.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(memberSearchText.toLowerCase()))
    );

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Teams" />

            {/* Page Header & Create Team Button matching Web App */}
            <View style={tw`px-4 pt-5 pb-2 flex-row justify-between items-center`}>
                <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-2xl font-bold text-gray-900 dark:text-white`}>
                        Team Management
                    </Text>
                    <Text style={tw`text-[10px] text-gray-500 dark:text-purple-200/70 mt-0.5 font-medium`}>
                        Organize your workforce into functional units.
                    </Text>
                </View>

                {isAdmin && (
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        activeOpacity={0.7}
                        style={tw`flex-row items-center gap-1.5 px-4 py-2.5 bg-[#8b5cf6] rounded-2xl shadow-lg shadow-[#8b5cf6]/30 border border-[#8b5cf6] active:scale-95`}
                    >
                        <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                        <Text style={tw`text-white font-bold text-xs tracking-wide`}>Create Team</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : teams.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Users size={48} color="#cbd5e1" style={tw`mb-4 opacity-50`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Teams Found</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>Add a new team to manage departments.</Text>
                </View>
            ) : (
                <ScrollView style={tw`flex-1 px-4 pt-2`} contentContainerStyle={tw`pb-12`}>
                    {teams.map((team) => {
                        const managerInit = (team.manager?.name || 'U').charAt(0);
                        return (
                            <View 
                                key={team.id}
                                style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl mb-4 border border-gray-200 dark:border-white/5 shadow-md`}
                            >
                                {/* Top Section: Suitcase Icon + Title/Description + 3-dots */}
                                <View style={tw`flex-row justify-between items-start mb-4`}>
                                    <View style={tw`flex-row items-center flex-1 mr-2`}>
                                        <View style={tw`w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center mr-3 shadow-sm`}>
                                            <Briefcase size={20} color="#3b82f6" />
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-bold text-gray-900 dark:text-white text-base`}>{team.name}</Text>
                                            <Text style={tw`text-xs text-gray-500 dark:text-purple-200/70 font-medium mt-0.5`}>
                                                {team.description || 'No description provided.'}
                                            </Text>
                                        </View>
                                    </View>
                                    {isAdmin && (
                                        <TouchableOpacity 
                                            onPress={() => {
                                                setActiveTeam(team);
                                                setShowOptionsSheet(true);
                                            }}
                                            activeOpacity={0.7}
                                            style={tw`p-2 bg-gray-50 dark:bg-[#230d4b] rounded-xl border border-gray-100 dark:border-[#6d28d9]/20`}
                                        >
                                            <MoreVertical size={18} color="#a78bfa" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Middle Section: Manager Card Box */}
                                <View style={tw`p-3 bg-gray-50 dark:bg-[#230d4b] rounded-2xl flex-row items-center gap-3 border border-gray-100 dark:border-[#6d28d9]/20`}>
                                    <View style={tw`w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center`}>
                                        <Text style={tw`text-white font-bold text-sm`}>{managerInit}</Text>
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-[9px] font-black text-gray-400 dark:text-purple-300/70 tracking-wider uppercase`}>MANAGER</Text>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>
                                            {team.manager?.name || 'Unassigned'}
                                        </Text>
                                    </View>
                                </View>
                                
                                {/* Bottom Section: Members Count + View Members button */}
                                <View style={tw`flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-[#6d28d9]/20`}>
                                    <View style={tw`flex-row items-center gap-1.5`}>
                                        <Users size={14} color="#a78bfa" />
                                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200/70 font-medium`}>
                                            {team.members?.length || 0} Members
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setActiveTeam(team);
                                            setShowRosterModal(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={tw`text-xs text-purple-600 dark:text-[#a78bfa] font-black`}>
                                            View Members
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Create Team Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={tw`flex-1`}
                >
                    <TouchableOpacity 
                        style={tw`flex-1 bg-black/60 justify-end`}
                        activeOpacity={1}
                        onPress={() => setShowCreateModal(false)}
                    >
                        <TouchableOpacity 
                            activeOpacity={1}
                            style={tw`bg-white dark:bg-[#1c1a45] p-6 rounded-t-3xl border-t border-gray-200 dark:border-white/5`}
                        >
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Create New Team</Text>
                                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={tw`p-1.5`}>
                                    <X size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View style={tw`mb-4`}>
                                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Team Name *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white text-sm`}
                                    placeholder="Engineering, Design..."
                                    placeholderTextColor="#94a3b8"
                                    value={newTeamName}
                                    onChangeText={setNewTeamName}
                                />
                            </View>

                            <View style={tw`mb-6`}>
                                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Description</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white text-sm`}
                                    placeholder="Describe the team responsibilities..."
                                    placeholderTextColor="#94a3b8"
                                    value={newTeamDesc}
                                    onChangeText={setNewTeamDesc}
                                />
                            </View>

                            <View style={tw`flex-row gap-4`}>
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleProceedToMembers}
                                    style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-white font-bold`}>Create</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Team Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={tw`flex-1`}
                >
                    <TouchableOpacity 
                        style={tw`flex-1 bg-black/60 justify-end`}
                        activeOpacity={1}
                        onPress={() => setShowEditModal(false)}
                    >
                        <TouchableOpacity 
                            activeOpacity={1}
                            style={tw`bg-white dark:bg-[#1c1a45] p-6 rounded-t-3xl border-t border-gray-200 dark:border-white/5`}
                        >
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Edit Team</Text>
                                <TouchableOpacity onPress={() => setShowEditModal(false)} style={tw`p-1.5`}>
                                    <X size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View style={tw`mb-4`}>
                                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Team Name *</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white text-sm`}
                                    placeholder="Engineering, Design..."
                                    placeholderTextColor="#94a3b8"
                                    value={editTeamName}
                                    onChangeText={setEditTeamName}
                                />
                            </View>

                            <View style={tw`mb-6`}>
                                <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Description</Text>
                                <TextInput
                                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white text-sm`}
                                    placeholder="Describe the team responsibilities..."
                                    placeholderTextColor="#94a3b8"
                                    value={editTeamDesc}
                                    onChangeText={setEditTeamDesc}
                                />
                            </View>

                            <View style={tw`flex-row gap-4`}>
                                <TouchableOpacity
                                    onPress={() => setShowEditModal(false)}
                                    style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleEditTeam}
                                    style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-white font-bold`}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Options Sheet Modal */}
            <Modal
                visible={showOptionsSheet}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowOptionsSheet(false)}
            >
                <TouchableOpacity 
                    style={tw`flex-1 bg-black/60 justify-end`}
                    activeOpacity={1}
                    onPress={() => setShowOptionsSheet(false)}
                >
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-t-3xl border-t border-gray-200 dark:border-[#8b5cf6]/30`}>
                        <Text style={tw`text-sm font-bold text-gray-400 mb-4 text-center`}>Team Actions</Text>
                        
                        <TouchableOpacity
                            onPress={() => {
                                setShowOptionsSheet(false);
                                setEditTeamName(activeTeam?.name || '');
                                setEditTeamDesc(activeTeam?.description || '');
                                setShowEditModal(true);
                            }}
                            style={tw`flex-row items-center gap-3 py-4 border-b border-gray-100 dark:border-white/5`}
                        >
                            <Briefcase size={20} color="#8b5cf6" />
                            <Text style={tw`text-base font-semibold text-gray-700 dark:text-gray-200`}>Edit Team</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                handleOpenAccessControl(activeTeam);
                            }}
                            style={tw`flex-row items-center gap-3 py-4 border-b border-gray-100 dark:border-white/5`}
                        >
                            <Users size={20} color="#8b5cf6" />
                            <Text style={tw`text-base font-semibold text-gray-700 dark:text-gray-200`}>Access Control</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setShowOptionsSheet(false);
                                setShowDeleteConfirm(true);
                            }}
                            style={tw`flex-row items-center gap-3 py-4 mb-4`}
                        >
                            <Trash2 size={20} color="#f43f5e" />
                            <Text style={tw`text-base font-semibold text-[#f43f5e]`}>Delete Team</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowOptionsSheet(false)}
                            style={tw`w-full py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                        >
                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirm}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowDeleteConfirm(false)}
            >
                <View style={tw`flex-1 bg-black/60 justify-center items-center p-6`}>
                    <View style={tw`bg-white dark:bg-[#1c1a45] p-6 rounded-3xl border border-gray-200 dark:border-white/5 w-full max-w-sm text-center items-center shadow-2xl`}>
                        <View style={tw`w-16 h-16 mb-4 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center`}>
                            <Trash2 size={32} color="#ef4444" />
                        </View>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-2`}>Delete Team?</Text>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mb-6 text-center font-medium`}>
                            Are you sure you want to delete this team? This action cannot be undone.
                        </Text>
                        <View style={tw`flex-row gap-3 w-full`}>
                            <TouchableOpacity
                                onPress={() => setShowDeleteConfirm(false)}
                                style={tw`flex-1 py-3 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                            >
                                <Text style={tw`text-gray-600 dark:text-gray-300 font-bold text-xs`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleDeleteTeam}
                                style={tw`flex-1 py-3 bg-rose-500 rounded-xl items-center shadow-lg shadow-rose-500/30`}
                            >
                                <Text style={tw`text-white font-bold text-xs`}>Yes, Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Team Roster Modal */}
            <Modal
                visible={showRosterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRosterModal(false)}
            >
                <View style={tw`flex-1 bg-black/60 justify-end`}>
                    <View style={tw`bg-white dark:bg-[#1c1a45] p-6 rounded-t-3xl border-t border-gray-200 dark:border-white/5 max-h-[80%]`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <View>
                                <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>
                                    {activeTeam?.name}
                                </Text>
                                <Text style={tw`text-xs text-gray-400`}>Team Roster</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowRosterModal(false);
                                    setConfirmRemoveEmployeeId(null);
                                }}
                                style={tw`p-1.5`}
                            >
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={tw`flex-grow-0 mb-4`}>
                            {isAdmin && (
                                <TouchableOpacity
                                    onPress={() => {
                                        const currentMemberIds = activeTeam?.members?.map((m: any) => m.id) || [];
                                        setSelectedEmployees(currentMemberIds);
                                        const currentMgrId = activeTeam?.managerId || activeTeam?.manager?.id || null;
                                        setSelectedManagerId(currentMgrId);
                                        
                                        setShowRosterModal(false);
                                        setShowAddMemberModal(true);
                                    }}
                                    style={tw`flex-row items-center justify-center gap-2 p-3.5 mb-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl`}
                                >
                                    <UserPlus size={18} color="#8b5cf6" />
                                    <Text style={tw`text-[#8b5cf6] font-bold text-xs`}>Add Member</Text>
                                </TouchableOpacity>
                            )}

                            {activeTeam?.members?.length === 0 ? (
                                <Text style={tw`text-center text-gray-400 py-6 text-xs`}>No members in this team.</Text>
                            ) : (
                                activeTeam?.members?.map((emp: any) => {
                                    const initials = emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
                                    const isRemoving = confirmRemoveEmployeeId === emp.id;
                                    
                                    return (
                                        <View 
                                            key={emp.id}
                                            style={tw`flex-row items-center justify-between p-3 bg-gray-50 dark:bg-[#1c1a45] rounded-2xl mb-2.5`}
                                        >
                                            <View style={tw`flex-row items-center flex-1 mr-2`}>
                                                <View style={tw`w-9 h-9 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center mr-3`}>
                                                    <Text style={tw`text-[#8b5cf6] dark:text-[#c4b5fd] font-bold text-xs`}>{initials}</Text>
                                                </View>
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`font-bold text-gray-900 dark:text-white text-xs`}>{emp.name}</Text>
                                                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                        {typeof emp.role === 'object' ? emp.role?.name || 'Employee' : emp.role || 'Employee'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {isAdmin && (
                                                <View style={tw`relative`}>
                                                    {isRemoving ? (
                                                        <View style={tw`flex-row gap-2`}>
                                                            <TouchableOpacity 
                                                                onPress={() => setConfirmRemoveEmployeeId(null)}
                                                                style={tw`px-2.5 py-1 bg-gray-200 dark:bg-white/10 rounded-lg`}
                                                            >
                                                                <Text style={tw`text-xs text-gray-600 dark:text-gray-300 font-bold`}>No</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity 
                                                                onPress={() => handleRemoveMember(emp.id)}
                                                                style={tw`px-2.5 py-1 bg-rose-500 rounded-lg`}
                                                            >
                                                                <Text style={tw`text-xs text-white font-bold`}>Remove</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity 
                                                            onPress={() => setConfirmRemoveEmployeeId(emp.id)}
                                                            style={tw`px-2 py-1`}
                                                        >
                                                            <Text style={tw`text-xs text-rose-500 font-semibold`}>Remove</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => {
                                setShowRosterModal(false);
                                setConfirmRemoveEmployeeId(null);
                            }}
                            style={tw`w-full py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                        >
                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Members Modal */}
            <Modal
                visible={showAddMemberModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowAddMemberModal(false);
                    setMemberSearchText('');
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={tw`flex-1`}
                >
                    <View style={tw`flex-1 bg-black/60 justify-end`}>
                        <View style={tw`bg-white dark:bg-[#1c1a45] p-6 rounded-t-3xl border-t border-gray-200 dark:border-white/5 h-[85%] flex-col`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <View>
                                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Add Members</Text>
                                    <Text style={tw`text-xs text-gray-400`}>Select team members and designate a manager</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setShowAddMemberModal(false);
                                        setMemberSearchText('');
                                    }}
                                    style={tw`p-1.5`}
                                >
                                    <X size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            {/* Search bar inside Modal */}
                            <View style={tw`flex-row items-center bg-gray-50 dark:bg-[#1c1a45] border border-gray-100 dark:border-white/5 rounded-2xl px-3 py-1 mb-4`}>
                                <TextInput
                                    style={tw`flex-1 text-xs text-gray-805 dark:text-white h-9`}
                                    placeholder="Search employees to add..."
                                    placeholderTextColor="#94a3b8"
                                    value={memberSearchText}
                                    onChangeText={setMemberSearchText}
                                />
                            </View>

                            <ScrollView style={tw`flex-1 mb-4`} contentContainerStyle={tw`pb-4`}>
                                {filteredEmployees.length === 0 ? (
                                    <Text style={tw`text-center text-gray-400 py-6 text-xs`}>No employees found</Text>
                                ) : (
                                    filteredEmployees.map((emp: any) => {
                                        const isSelected = selectedEmployees.includes(emp.id);
                                        const isManager = selectedManagerId === emp.id;
                                        
                                        let cardBg = 'bg-gray-50 dark:bg-[#1c1a45] border border-transparent';
                                        if (isManager) {
                                            cardBg = 'bg-yellow-500/10 border border-yellow-500/30';
                                        } else if (isSelected) {
                                            cardBg = 'bg-green-500/10 border border-green-500/30';
                                        }

                                        return (
                                            <View 
                                                key={emp.id}
                                                style={tw`flex-row items-center justify-between p-3 rounded-2xl mb-2.5 ${cardBg}`}
                                            >
                                                <View style={tw`flex-1 mr-2`}>
                                                    <Text style={tw`font-bold text-gray-900 dark:text-white text-xs`}>{emp.name}</Text>
                                                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                        {typeof emp.role === 'object' ? emp.role?.name || 'Employee' : emp.role || 'Employee'}
                                                    </Text>
                                                </View>

                                                <View style={tw`flex-row items-center gap-2`}>
                                                    <TouchableOpacity
                                                        onPress={() => handleToggleManager(emp.id)}
                                                        style={tw`px-2.5 py-1.5 rounded-lg ${
                                                            isManager 
                                                                ? 'bg-yellow-500 text-white' 
                                                                : 'bg-transparent border border-gray-300 dark:border-white/10'
                                                        }`}
                                                    >
                                                        <Text style={tw`text-[10px] font-bold ${isManager ? 'text-white' : 'text-gray-400'}`}>
                                                            Manager
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            if (isSelected) {
                                                                setSelectedEmployees(prev => prev.filter(id => id !== emp.id));
                                                                if (isManager) setSelectedManagerId(null);
                                                            } else {
                                                                setSelectedEmployees(prev => [...prev, emp.id]);
                                                            }
                                                        }}
                                                        style={tw`px-2.5 py-1.5 rounded-lg ${
                                                            isSelected 
                                                                ? 'bg-green-500 text-white' 
                                                                : 'bg-[#8b5cf6]'
                                                        }`}
                                                    >
                                                        <Text style={tw`text-[10px] font-bold text-white`}>
                                                            {isSelected ? 'Added' : 'Add'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </ScrollView>

                            <View style={tw`flex-row gap-4`}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowAddMemberModal(false);
                                        setMemberSearchText('');
                                    }}
                                    style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSaveMembers}
                                    style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                                >
                                    <Text style={tw`text-white font-bold`}>
                                        {activeTeam ? 'Save Members' : 'Create Team'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Access Control Modal */}
            <Modal
                visible={showAccessControlModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAccessControlModal(false)}
            >
                <View style={tw`flex-1 bg-black/60 justify-end`}>
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-t-3xl border-t border-gray-200 dark:border-[#8b5cf6]/30 max-h-[85%]`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <View>
                                <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Access Control</Text>
                                <Text style={tw`text-xs text-gray-400 mt-1`}>
                                    Configure manager dashboard tabs for {activeTeam?.name}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setShowAccessControlModal(false)}
                                style={tw`p-1.5`}
                            >
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={tw`flex-grow-0 mb-6`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3`}>
                                Select allowed dashboard tabs
                            </Text>

                            {[
                                { key: 'list', label: 'Employee List', desc: 'Allows viewing and searching the team member roster' },
                                { key: 'attendance', label: 'Attendance', desc: 'Allows viewing daily attendance sheets of the team' },
                                { key: 'leaveApproval', label: 'Leave Approval', desc: 'Allows reviewing, approving, and rejecting leave requests' },
                                { key: 'regularization', label: 'Regularization', desc: 'Allows managing attendance corrections and requests' }
                            ].map((option) => {
                                const isChecked = (permissions as any)[option.key];
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        onPress={() => setPermissions(prev => ({ ...prev, [option.key]: !isChecked }))}
                                        style={tw`p-4 rounded-2xl border-2 mb-3 flex-row items-start gap-3.5 ${
                                            isChecked
                                                ? 'border-[#8b5cf6] bg-[#8b5cf6]/5'
                                                : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1c1a45]'
                                        }`}
                                    >
                                        <View style={tw`mt-0.5 w-4.5 h-4.5 rounded border ${
                                            isChecked 
                                                ? 'bg-[#8b5cf6] border-[#8b5cf6] items-center justify-center' 
                                                : 'border-gray-300 dark:border-white/20'
                                        }`}>
                                            {isChecked && <Check size={12} color="white" />}
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-bold text-xs text-gray-805 dark:text-white`}>{option.label}</Text>
                                            <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>{option.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={tw`flex-row gap-4`}>
                            <TouchableOpacity
                                onPress={() => setShowAccessControlModal(false)}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                            >
                                <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSaveAccessControl}
                                style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                            >
                                <Text style={tw`text-white font-bold`}>Save Permissions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

