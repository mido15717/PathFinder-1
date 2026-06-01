import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../types/navigation";
import { isValidEmail, passwordError, required } from "../../utils/validation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {
      email: required(email, "Email") || (!isValidEmail(email) ? "Enter a valid email" : ""),
      password: passwordError(password)
    };
    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.brand}>PathFinder</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your PathFinder account and profile.</Text>
          </View>

          <Card style={styles.form}>
            <CustomInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
            <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry secureToggle error={errors.password} />
            <ErrorMessage message={submitError} />
            <CustomButton title="Login" onPress={submit} loading={loading} />
            <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
              <Text style={styles.linkText}>New to PathFinder? Create an account</Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xl
  },
  hero: {
    gap: spacing.sm
  },
  brand: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600"
  },
  form: {
    gap: spacing.lg
  },
  linkWrap: {
    alignItems: "center"
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800"
  }
});
