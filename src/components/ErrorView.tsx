import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppButton } from './AppButton';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  retryTitle?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryTitle = 'Try Again',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notice</Text>
      <Text style={styles.message}>{message}</Text>
      {!!onRetry && (
        <View style={styles.buttonWrapper}>
          <AppButton title={retryTitle} onPress={onRetry} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 240,
  },
});
