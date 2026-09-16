import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ExamSelectionScreen } from '../screens/ExamSelectionScreen';
import { SubjectsScreen } from '../screens/SubjectsScreen';
import { TopicsScreen } from '../screens/TopicsScreen';
import { DifficultyScreen } from '../screens/DifficultyScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { MockInstructionsScreen } from '../screens/MockInstructionsScreen';
import { MockTestScreen } from '../screens/MockTestScreen';
import { MockResultScreen } from '../screens/MockResultScreen';
import { MockReviewScreen } from '../screens/MockReviewScreen';
import { PerformanceScreen } from '../screens/PerformanceScreen';
import { RevisionScreen } from '../screens/RevisionScreen';
import { DailyStudyPlanScreen } from '../screens/DailyStudyPlanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExamSelection"
        component={ExamSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Subjects"
        component={SubjectsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Topics"
        component={TopicsScreen}
        options={{
          title: 'Select Topic',
        }}
      />
      <Stack.Screen
        name="Difficulty"
        component={DifficultyScreen}
        options={{
          title: 'Select Difficulty',
        }}
      />
      <Stack.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          title: 'Practice Test',
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          title: 'Test Summary',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="MockInstructions"
        component={MockInstructionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockTest"
        component={MockTestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockResult"
        component={MockResultScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockReview"
        component={MockReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Performance"
        component={PerformanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Revision"
        component={RevisionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyStudyPlan"
        component={DailyStudyPlanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
