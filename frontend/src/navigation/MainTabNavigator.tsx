import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/colors";
import { ExploreCareersScreen } from "../screens/main/ExploreCareersScreen";
import { HomeScreen } from "../screens/main/HomeScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import type { MainTabParamList, ProfileStackParamList } from "../types/navigation";

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800"
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName = getIconName(route.name, focused);
          return <Ionicons name={iconName} size={22} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ExploreCareers" component={ExploreCareersScreen} options={{ title: "Careers" }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

function getIconName(routeName: keyof MainTabParamList, focused: boolean): keyof typeof Ionicons.glyphMap {
  if (routeName === "Home") return focused ? "home" : "home-outline";
  if (routeName === "ExploreCareers") return focused ? "compass" : "compass-outline";
  return focused ? "person-circle" : "person-circle-outline";
}
