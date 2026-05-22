import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";
import { CareerDetailsScreen } from "../screens/career/CareerDetailsScreen";
import { CareerWorkspaceScreen } from "../screens/main/CareerWorkspaceScreen";
import { ExploreScreen } from "../screens/main/ExploreScreen";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ProgressScreen } from "../screens/main/ProgressScreen";
import { CourseProgressScreen } from "../screens/progress/CourseProgressScreen";
import { RoadmapProgressScreen } from "../screens/progress/RoadmapProgressScreen";
import { CareerAssessmentScreen } from "../screens/roadmap/CareerAssessmentScreen";
import { RoadmapDetailsScreen } from "../screens/roadmap/RoadmapDetailsScreen";
import { RoadmapScreen } from "../screens/roadmap/RoadmapScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import type {
  ExploreStackParamList,
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  ProgressStackParamList,
  RoadmapStackParamList
} from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RoadmapStack = createNativeStackNavigator<RoadmapStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="CareerWorkspace" component={CareerWorkspaceScreen} />
    </HomeStack.Navigator>
  );
}

function RoadmapNavigator() {
  return (
    <RoadmapStack.Navigator screenOptions={{ headerShown: false }}>
      <RoadmapStack.Screen name="RoadmapMain" component={RoadmapScreen} />
      <RoadmapStack.Screen name="CareerAssessment" component={CareerAssessmentScreen} />
      <RoadmapStack.Screen name="RoadmapDetails" component={RoadmapDetailsScreen} />
    </RoadmapStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="CareerDetails" component={CareerDetailsScreen} />
    </ExploreStack.Navigator>
  );
}

function ProgressNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="ProgressMain" component={ProgressScreen} />
      <ProgressStack.Screen name="CourseProgress" component={CourseProgressScreen} />
      <ProgressStack.Screen name="RoadmapProgress" component={RoadmapProgressScreen} />
    </ProgressStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

const tabIcon = (routeName: keyof MainTabParamList, focused: boolean) => {
  const icons = {
    HomeTab: focused ? "home" : "home-outline",
    RoadmapTab: focused ? "map" : "map-outline",
    ExploreTab: focused ? "compass" : "compass-outline",
    ProgressTab: focused ? "stats-chart" : "stats-chart-outline",
    ProfileTab: focused ? "person-circle" : "person-circle-outline"
  } as const;
  return icons[routeName];
};

export function MainNavigator() {
  const { colors } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 10
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={22} color={color} />
        )
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="RoadmapTab" component={RoadmapNavigator} options={{ title: "Roadmap" }} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ title: "Explore" }} />
      <Tab.Screen name="ProgressTab" component={ProgressNavigator} options={{ title: "Progress" }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
