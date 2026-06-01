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

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {
      fullName: required(fullName, "Full name"),
      email: required(email, "Email") || (!isValidEmail(email) ? "Enter a valid email" : ""),
      password: passwordError(password),
      confirmPassword: confirmPassword !== password ? "Passwords do not match" : ""
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Registration failed");
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start with secure authentication and a clean student profile.</Text>
          </View>

          <Card style={styles.form}>
            <CustomInput label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
            <CustomInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
            <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry secureToggle error={errors.password} />
            <CustomInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry secureToggle error={errors.confirmPassword} />
            <ErrorMessage message={submitError} />
            <CustomButton title="Register" onPress={submit} loading={loading} />
            <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
              <Text style={styles.linkText}>Already have an account? Login</Text>
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
