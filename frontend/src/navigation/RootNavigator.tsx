import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { AssessmentResultScreen } from "../screens/assessment/AssessmentResultScreen";
import { CareerAssessmentScreen } from "../screens/assessment/CareerAssessmentScreen";
import { CareerDetailsScreen } from "../screens/career/CareerDetailsScreen";
import type { AppStackParamList } from "../types/navigation";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";

const AppStack = createNativeStackNavigator<AppStackParamList>();

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStack.Screen name="CareerAssessment" component={CareerAssessmentScreen} />
      <AppStack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <AppStack.Screen name="CareerDetails" component={CareerDetailsScreen} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Preparing PathFinder..." />;
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
