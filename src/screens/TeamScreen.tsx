import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Users, Plus, ArrowLeft } from 'lucide-react-native';
import { getTeams, createTeam as createTeamApi } from '../utils/teamApi';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';

export default function TeamScreen({ navigation }: any) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'HR_ADMIN';

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDesc, setNewTeamDesc] = useState('');

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

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) {
            Alert.alert("Required", "Please provide a team name.");
            return;
        }

        try {
            await createTeamApi({ name: newTeamName, description: newTeamDesc });
            Alert.alert("Success", "Team created successfully!");
            setShowCreateModal(false);
            setNewTeamName('');
            setNewTeamDesc('');
            fetchTeams();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to create team.");
        }
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Teams" />

            {isAdmin && (
                <View style={tw`px-4 pt-4`}>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        style={tw`flex-row items-center justify-center gap-2 p-4 bg-[#f5f3ff] dark:bg-[#12112b] border border-dashed border-[#c4b5fd] dark:border-white/5 rounded-3xl`}
                    >
                        <Plus size={18} color="#8b5cf6" />
                        <Text style={tw`text-[#7c3aed] dark:text-[#c4b5fd] font-bold text-xs`}>Create New Team</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : teams.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Users size={48} color="#cbd5e1" style={tw`mb-4`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Teams Found</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>Add a new team to manage departments.</Text>
                </View>
            ) : (
                <ScrollView style={tw`flex-grow p-4`} contentContainerStyle={tw`pb-12`}>
                    {teams.map((team) => (
                        <View 
                            key={team.id}
                            style={tw`bg-white dark:bg-[#12112b] p-5 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}
                        >
                            <Text style={tw`font-bold text-base text-gray-900 dark:text-white`}>{team.name}</Text>
                            <Text style={tw`text-xs text-gray-500 mt-1`}>{team.description || 'No description provided.'}</Text>
                            
                            <View style={tw`flex-row justify-between items-center mt-4 pt-3 border-t border-gray-50 dark:border-white/5`}>
                                <View style={tw`flex-row items-center gap-1`}>
                                    <Users size={14} color="#64748b" />
                                    <Text style={tw`text-xs text-gray-500 font-medium`}>
                                        {team.members?.length || 0} Members
                                    </Text>
                                </View>
                                <Text style={tw`text-xs text-[#8b5cf6] dark:text-[#c4b5fd] font-bold`}>
                                    Manager: {team.manager?.name || 'Unassigned'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Create Team Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={tw`bg-white dark:bg-[#12112b] p-6 rounded-t-3xl border-t border-gray-200 dark:border-white/5`}>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>Create New Team</Text>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Team Name *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-805`}
                                placeholder="Engineering, Design..."
                                value={newTeamName}
                                onChangeText={setNewTeamName}
                            />
                        </View>

                        <View style={tw`mb-6`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Description</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-805`}
                                placeholder="Describe the team responsibilities..."
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
                                onPress={handleCreateTeam}
                                style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                            >
                                <Text style={tw`text-white font-bold`}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
