import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { Building2, Landmark, Calendar, ShieldCheck, Sliders, ChevronRight, ArrowLeft } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';

type MastersTab = 'MENU' | 'DEPT' | 'SHIFTS' | 'HOLIDAYS';

export default function MastersScreen({ navigation }: any) {
    const [currentView, setCurrentView] = useState<MastersTab>('MENU');
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);

    const fetchMastersData = async (type: MastersTab) => {
        setLoading(true);
        setCurrentView(type);
        try {
            let endpoint = '';
            if (type === 'DEPT') endpoint = '/masters/departments';
            else if (type === 'SHIFTS') endpoint = '/masters/shifts';
            else if (type === 'HOLIDAYS') endpoint = '/masters/holidays';

            if (endpoint) {
                const res = await api.get(endpoint);
                setDataList(res.data || []);
            }
        } catch (error) {
            console.error('Error fetching masters detail:', error);
            setDataList([]);
        } finally {
            setLoading(false);
        }
    };

    const renderMenuItem = (title: string, icon: any, type: MastersTab) => (
        <TouchableOpacity
            onPress={() => fetchMastersData(type)}
            style={tw`flex-row justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-3xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm`}
        >
            <View style={tw`flex-row items-center`}>
                <View style={tw`p-2.5 bg-indigo-50 dark:bg-slate-700 rounded-2xl mr-3`}>
                    {React.createElement(icon, { size: 20, color: '#6366f1' })}
                </View>
                <Text style={tw`text-sm font-bold text-gray-800 dark:text-white`}>{title}</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
    );

    const renderDetailItem = ({ item }: { item: any }) => (
        <View style={tw`bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 border border-gray-100 dark:border-slate-700 shadow-sm`}>
            <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{item.name || item.title || 'Master record'}</Text>
            {item.description ? <Text style={tw`text-xs text-gray-400 mt-1`}>{item.description}</Text> : null}
            {item.date ? <Text style={tw`text-xs text-indigo-500 font-bold mt-1`}>{item.date}</Text> : null}
            {item.inTime && item.outTime ? (
                <Text style={tw`text-xs text-indigo-500 font-bold mt-1`}>
                    Shift: {item.inTime} - {item.outTime}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>
            
            {currentView === 'MENU' ? (
                <CustomHeader navigation={navigation} title="Masters" />
            ) : (
                <View style={tw`flex-row items-center p-4 bg-white dark:bg-slate-800 border-b border-gray-150 dark:border-slate-700`}>
                    <TouchableOpacity onPress={() => setCurrentView('MENU')} style={tw`p-2 mr-2`}>
                        <ArrowLeft size={20} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>
                        {currentView === 'DEPT' ? 'Departments' :
                         currentView === 'SHIFTS' ? 'Shifts' : 'Holidays'}
                    </Text>
                </View>
            )}

            {currentView === 'MENU' ? (
                <ScrollView style={tw`flex-grow p-4`}>
                    <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mb-6 mt-2`}>
                        Manage organization structure, shifts, and system configurations.
                    </Text>

                    {renderMenuItem('Departments & Structure', Building2, 'DEPT')}
                    {renderMenuItem('Work Shifts Roster', Sliders, 'SHIFTS')}
                    {renderMenuItem('Company Holidays Calendar', Calendar, 'HOLIDAYS')}
                </ScrollView>
            ) : (
                <View style={tw`flex-1 p-4`}>
                    {loading ? (
                        <View style={tw`flex-1 justify-center`}>
                            <ActivityIndicator size="large" color="#6366f1" />
                        </View>
                    ) : (
                        <FlatList
                            data={dataList}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderDetailItem}
                            ListEmptyComponent={
                                <Text style={tw`text-center text-gray-400 py-10`}>No configuration entries found.</Text>
                            }
                        />
                    )}
                </View>
            )}

        </View>
    );
}
