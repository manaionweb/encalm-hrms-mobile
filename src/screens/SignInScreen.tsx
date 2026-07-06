import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';

export default function SignInScreen({ navigation }: any) {
    const { setTheme } = useTheme();
    const { login, error: authError } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            await setTheme('dark');
            // Root navigator will switch to protected screens upon user authenticated status change.
        } catch (err: any) {
            console.error("Login failed", err);
            Alert.alert("Login Failed", authError || err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-[#1e1b4b]`}
        >
            <ScrollView contentContainerStyle={tw`flex-grow justify-center p-6`} keyboardShouldPersistTaps="handled">
                <View style={tw`bg-white rounded-3xl shadow-xl p-6 md:p-8 w-full max-w-sm self-center`}>
                    
                    {/* Header Logo */}
                    <View style={tw`items-center mb-6`}>
                        <Image
                            source={require('../../assets/veda-logo.png')}
                            style={[tw`w-20 h-20`, { resizeMode: 'contain' }]}
                        />
                        <Text style={tw`text-2xl font-bold text-gray-900 mt-2`}>EnCalm HRX</Text>
                        <Text style={tw`text-xs text-gray-500 mt-1 text-center font-medium`}>
                            Smart Payroll. Seamless Compliance.
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={tw`space-y-4`}>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide`}>Username or E-mail</Text>
                            <TextInput
                                style={tw`w-full px-4 py-3 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-gray-700 font-medium`}
                                placeholder="Enter your username"
                                placeholderTextColor="#cbd5e1"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide`}>Password</Text>
                            <View style={tw`relative justify-center`}>
                                <TextInput
                                    style={tw`w-full px-4 py-3 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-gray-700 font-medium pr-12`}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#cbd5e1"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={tw`absolute right-4 p-1`}
                                >
                                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        style={tw`w-full py-3.5 bg-[#8b5cf6] rounded-full items-center mt-4 shadow-lg`}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white font-bold text-lg`}>
                            {loading ? "Logging in..." : "Log In"}
                        </Text>
                    </TouchableOpacity>

                    {/* Actions */}
                    <View style={tw`items-center mt-6`}>
                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                            <Text style={tw`text-[#8b5cf6] font-bold text-sm`}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
