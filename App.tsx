import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import tw from 'twrnc';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const formattedMessage = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const result = window.confirm(formattedMessage);
      if (result) {
        const okButton = buttons[buttons.length - 1];
        if (okButton && okButton.onPress) okButton.onPress();
      } else {
        const cancelButton = buttons[0];
        if (cancelButton && cancelButton.onPress) cancelButton.onPress();
      }
    } else {
      window.alert(formattedMessage);
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  };
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function MainApp() {
  const { theme } = useTheme();

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <MainApp />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
