import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Captcha } from '../components/auth/Captcha';
import { OtpInput } from '../components/auth/OtpInput';
import api from '../utils/api';
import tw from 'twrnc';
import { useToast } from '../context/ToastContext';

type AuthStep = 'INITIAL_FORM' | 'OTP_VERIFICATION';

export default function ForgotPasswordScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [step, setStep] = useState<AuthStep>('INITIAL_FORM');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [generatedCaptcha, setGeneratedCaptcha] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim() || !password.trim() || !confirmPassword.trim() || !captchaInput.trim()) {
            showToast("Please fill in all required fields.", 'error');
            return;
        }

        if (captchaInput.toUpperCase() !== generatedCaptcha.toUpperCase()) {
            showToast("Invalid Captcha. Please try again.", 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email, mode: 'FORGOT_PASSWORD' });
            setStep('OTP_VERIFICATION');
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to send OTP. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length < 6) {
            showToast("Please enter a valid 6-digit OTP.", 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                password,
                otp
            });

            showToast("Password reset successfully! Please login.", 'success');
            setTimeout(() => {
                navigation.navigate('SignIn');
            }, 1000);
        } catch (err: any) {
            showToast(err.response?.data?.message || "Verification failed. Invalid OTP.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderInitialForm = () => (
        <View style={tw`space-y-4`}>
            <Text style={tw`text-2xl font-bold text-gray-800 text-center mb-4`}>Forgot Password</Text>

            <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide`}>Registered Email / Mobile *</Text>
                <TextInput
                    style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-gray-700 font-medium`}
                    placeholder="admin@gmail.com"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide`}>New Password *</Text>
                <View style={tw`relative justify-center`}>
                    <TextInput
                        style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-gray-700 font-medium pr-12`}
                        placeholder="Enter New Password"
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
                        {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide`}>Confirm Password *</Text>
                <View style={tw`relative justify-center`}>
                    <TextInput
                        style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-gray-700 font-medium pr-12`}
                        placeholder="Enter Confirm Password"
                        placeholderTextColor="#cbd5e1"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={tw`absolute right-4 p-1`}
                    >
                        {showConfirmPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={tw`mb-4`}>
                <Captcha onVerify={setGeneratedCaptcha}>
                    <TextInput
                        style={tw`w-28 h-12 bg-[#f5f3ff] border border-gray-300 focus:border-[#8b5cf6] rounded-xl text-center font-bold text-gray-900 tracking-widest`}
                        placeholder="----"
                        placeholderTextColor="#cbd5e1"
                        autoCapitalize="characters"
                        value={captchaInput}
                        onChangeText={setCaptchaInput}
                    />
                </Captcha>
            </View>

            <TouchableOpacity
                onPress={handleSendOTP}
                disabled={loading}
                style={tw`w-full py-3.5 bg-[#8b5cf6] rounded-xl items-center mt-4 shadow-lg`}
                activeOpacity={0.8}
            >
                <Text style={tw`text-white font-bold`}>
                    {loading ? 'Sending...' : 'Send OTP'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={tw`mt-4 items-center`}>
                <Text style={tw`text-[#8b5cf6] font-bold text-sm`}>Back to Login</Text>
            </TouchableOpacity>
        </View>
    );

    const renderOtpStep = () => (
        <View style={tw`space-y-4`}>
            <View style={tw`text-center mb-6`}>
                <Text style={tw`text-2xl font-bold text-gray-800 text-center mb-1`}>Verify OTP</Text>
                <Text style={tw`text-gray-500 text-sm text-center`}>We've sent a code to your email/mobile</Text>
            </View>

            <View style={tw`py-4 mb-4`}>
                <OtpInput onComplete={setOtp} />
            </View>

            <TouchableOpacity
                onPress={handleVerifyOTP}
                disabled={loading || otp.length < 6}
                style={tw`w-full py-3.5 bg-[#8b5cf6] rounded-xl items-center shadow-lg ${otp.length < 6 ? 'opacity-50' : ''}`}
                activeOpacity={0.8}
            >
                <Text style={tw`text-white font-bold`}>
                    {loading ? 'Verifying...' : 'Confirm'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setStep('INITIAL_FORM')}
                style={tw`flex-row items-center justify-center mt-6`}
            >
                <ArrowLeft size={16} color="#94a3b8" />
                <Text style={tw`text-gray-500 font-medium text-sm ml-2`}>Change Email / Password</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-[#1e1b4b]`}
        >
            <ScrollView contentContainerStyle={tw`flex-grow justify-center p-6`} keyboardShouldPersistTaps="handled">
                <View style={tw`bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm self-center`}>
                    {step === 'INITIAL_FORM' ? renderInitialForm() : renderOtpStep()}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
