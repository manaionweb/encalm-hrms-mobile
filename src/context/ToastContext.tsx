import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Check, X, AlertCircle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [toast, setToast] = useState<ToastOptions | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-50)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setToast({ message, type, duration });
        setVisible(true);

        fadeAnim.setValue(0);
        slideAnim.setValue(-50);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();

        timerRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    };

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            setToast(null);
        });
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const getToastStyle = (type?: ToastType) => {
        switch (type) {
            case 'error':
                return { backgroundColor: 'red' };
            case 'success':
                return { backgroundColor: 'green' };
            default:
                return { backgroundColor: '#333333' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && toast ? (
                <Animated.View
                    style={[
                        tw`absolute z-50 items-center justify-center`,
                        {
                            top: insets.top > 0 ? insets.top + 8 : 16,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            alignSelf: 'center',
                            width: SCREEN_WIDTH,
                        },
                    ]}
                >
                    <View
                        style={[
                            tw`flex-row items-center rounded-full shadow-lg`,
                            getToastStyle(toast.type),
                            { paddingVertical: 8, paddingHorizontal: 16, maxWidth: SCREEN_WIDTH - 40 },
                        ]}
                    >
                        <View
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 8,
                            }}
                        >
                            {toast.type === 'success' ? <Check size={12} color="green" strokeWidth={4} /> : null}
                            {toast.type === 'error' ? <X size={12} color="red" strokeWidth={4} /> : null}
                            {toast.type === 'info' ? <Info size={12} color="#333" strokeWidth={4} /> : null}
                        </View>
                        <Text style={[tw`text-white font-semibold text-sm leading-5`, { flexShrink: 1 }]}>
                            {toast.message || ''}
                        </Text>
                    </View>
                </Animated.View>
            ) : null}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
