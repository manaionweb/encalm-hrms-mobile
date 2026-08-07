import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StatusBar } from 'react-native';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    // Background container opacity (starts 1.0 = solid black, no background flash)
    const containerFadeAnim = useRef(new Animated.Value(1)).current;

    // Logo Animations
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        // Step 1: Smooth Spring Pop-In + Fade-In
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 650,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Step 2: Gentle breathing pulse effect while on screen
            Animated.loop(
                Animated.sequence([
                    Animated.timing(logoScale, {
                        toValue: 1.05,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(logoScale, {
                        toValue: 1.0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });

        // Step 3: Exit transition (Zoom up + Fade out after 2 seconds)
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(containerFadeAnim, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1.15,
                    duration: 450,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onFinish();
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: containerFadeAnim }]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

            {/* Center Animated Logo */}
            <View style={styles.logoContainer}>
                <Animated.Image
                    source={require('../../assets/veda-logo.png')}
                    style={[
                        styles.logo,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                    resizeMode="contain"
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 999999,
        elevation: 999999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
    },
});
