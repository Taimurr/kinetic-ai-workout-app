import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface KineticTextProps extends TextProps {
  variant?: "headline" | "title" | "body" | "label" | "muted" | "brand";
  lime?: boolean;
}

export function KineticText({ variant = "body", lime, style, ...props }: KineticTextProps) {
  const colors = useColors();

  const baseStyle = {
    color: lime ? colors.primary : variant === "muted" ? colors.mutedForeground : colors.text,
  };

  const variantStyle = styles[variant];

  return <Text style={[baseStyle, variantStyle, style]} {...props} />;
}

const styles = StyleSheet.create({
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    lineHeight: 44,
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  muted: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
});
