# Developer Guide: Adding New Features

This practical guide provides step-by-step recipes for extending the mobile application with new screens, new API endpoints, and new features.

---

## 1. How to Add a New Screen

### Step 1: Define Route Types
Open [`mobile/src/navigation/types.ts`](../../mobile/src/navigation/types.ts) and add the new route name and its expected parameters to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  // Existing routes...
  BookmarkScreen: { subjectId?: string }; // Your new route
};

// Add typed ScreenProps export
export type BookmarkScreenProps = NativeStackScreenProps<RootStackParamList, 'BookmarkScreen'>;
```

### Step 2: Create the Screen Component
Create a new file in `mobile/src/screens/BookmarkScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { BookmarkScreenProps } from '../navigation/types';

export const BookmarkScreen: React.FC<BookmarkScreenProps> = ({ route, navigation }) => {
  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Saved Bookmarks</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
});
```

### Step 3: Register the Screen in AppNavigator
Open [`mobile/src/navigation/AppNavigator.tsx`](../../mobile/src/navigation/AppNavigator.tsx) and add the stack screen:

```tsx
import { BookmarkScreen } from '../screens/BookmarkScreen';

// Inside Stack.Navigator:
<Stack.Screen
  name="BookmarkScreen"
  component={BookmarkScreen}
  options={{ title: 'Bookmarks' }}
/>
```

---

## 2. How to Add a New API Service Endpoint

### Step 1: Define TypeScript Types
Open `mobile/src/types/` and create or edit the interface (e.g. `bookmark.ts`):

```typescript
export interface BookmarkItem {
  questionId: string;
  questionText: string;
  savedAt: string;
}
```

### Step 2: Add Service Function
In `mobile/src/services/api/` create or update a domain service:

```typescript
import { apiClient } from './apiClient';
import { BookmarkItem } from '../../types/bookmark';

export const bookmarkApi = {
  getBookmarks: async (): Promise<BookmarkItem[]> => {
    return apiClient.get<BookmarkItem[]>('/bookmarks');
  },
  saveBookmark: async (questionId: string): Promise<void> => {
    return apiClient.post('/bookmarks', { questionId });
  },
};
```

---

## 3. Best Practices & Rules

1. **Android Scrolling**:
   - Always wrap scrollable layouts in `<View style={{ flex: 1 }}>` (avoid `SafeAreaView` from `react-native`).
   - Use `contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}` and `nestedScrollEnabled={true}`.
2. **Never Call `fetch()` in Screens**:
   - Always route network calls through a service in `src/services/api/`.
3. **No `any` Types for Navigation**:
   - Always type route parameters in `RootStackParamList` and use `NativeStackScreenProps`.
4. **Always Run Typecheck and Tests Before Committing**:
   ```bash
   cd mobile && npx tsc --noEmit && npm test
   ```
