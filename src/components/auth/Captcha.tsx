import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import tw from 'twrnc';

interface CaptchaProps {
  onVerify: (code: string) => void;
  children?: React.ReactNode;
}

export const Captcha: React.FC<CaptchaProps> = ({ onVerify, children }) => {
  const [captchaText, setCaptchaText] = useState("");

  const generateCaptcha = useCallback(() => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    onVerify(result);
  }, [onVerify]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  return (
    <View style={tw`my-2`}>
      <View style={tw`flex-row items-center mb-1.5`}>
        <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wide mr-2`}>
          Enter Captcha *
        </Text>
        <TouchableOpacity
          onPress={generateCaptcha}
          style={tw`p-1`}
          activeOpacity={0.7}
        >
          <RefreshCw size={17} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      <View style={tw`flex-row gap-3 items-center`}>
        <View style={tw`w-32 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-300 shadow-sm`}>
          <Text
            style={[
              tw`text-xl font-bold tracking-widest text-gray-800 italic`,
              {
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              }
            ]}
          >
            {captchaText}
          </Text>
        </View>
        {children}
      </View>
    </View>
  );
};

import { Platform } from 'react-native';
export default Captcha;
