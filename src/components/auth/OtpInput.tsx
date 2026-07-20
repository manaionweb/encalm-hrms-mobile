import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput } from 'react-native';
import tw from 'twrnc';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChangeText = (text: string, index: number) => {
    if (text && isNaN(Number(text))) return;

    const newOtp = [...otp];
    newOtp[index] = text.substring(text.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (text && index < length - 1 && inputs.current[index + 1]) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every(val => val !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0 && inputs.current[index - 1]) {
        inputs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  return (
    <View style={tw`flex-row justify-between w-full`}>
      {otp.map((data, index) => (
        <TextInput
          key={index}
          style={tw`w-12 h-14 text-center text-2xl font-bold text-gray-900 border-2 border-gray-300 rounded-xl bg-[#f5f3ff] focus:border-[#8b5cf6] focus:bg-white`}
          keyboardType="numeric"
          maxLength={1}
          ref={(el) => { inputs.current[index] = el; }}
          value={data}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
        />
      ))}
    </View>
  );
};

export default OtpInput;
