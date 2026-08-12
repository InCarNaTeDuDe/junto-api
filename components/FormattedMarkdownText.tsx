import React from "react";
import { Text, TextStyle, View } from "react-native";

interface FormattedMarkdownTextProps {
  text: string;
  style?: TextStyle;
  isUser?: boolean;
}

/**
 * Robust markdown markup renderer for React Native chat messages.
 * Formats **bold**, *italic*, headers (#, ##, ###), lists (- or 1.), and inline code.
 */
export const FormattedMarkdownText: React.FC<FormattedMarkdownTextProps> = ({
  text,
  style,
  isUser,
}) => {
  if (!text) return null;

  // Inline formatter for bold, italic, code, and bold+italic
  const renderInlineFormattedText = (lineText: string, keyPrefix: string) => {
    // Regex matches **bold**, __bold__, *italic*, _italic_, `code`
    const tokenRegex =
      /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
    const parts = lineText.split(tokenRegex);

    return parts.map((part, index) => {
      const key = `${keyPrefix}-inline-${index}`;

      if (!part) return null;

      // Bold + Italic ***text***
      if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
        return (
          <Text key={key} style={{ fontWeight: "800", fontStyle: "italic" }}>
            {part.slice(3, -3)}
          </Text>
        );
      }

      // Bold **text** or __text__
      if (
        (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
      ) {
        return (
          <Text key={key} style={{ fontWeight: "800" }}>
            {part.slice(2, -2)}
          </Text>
        );
      }

      // Italic *text* or _text_
      if (
        (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
        (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
      ) {
        return (
          <Text key={key} style={{ fontStyle: "italic" }}>
            {part.slice(1, -1)}
          </Text>
        );
      }

      // Code `text`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <Text
            key={key}
            style={{
              fontFamily: "monospace",
              backgroundColor: isUser
                ? "rgba(255,255,255,0.25)"
                : "rgba(0,0,0,0.08)",
              borderRadius: 4,
              paddingHorizontal: 4,
              fontSize: 13,
            }}
          >
            {part.slice(1, -1)}
          </Text>
        );
      }

      return <Text key={key}>{part}</Text>;
    });
  };

  const lines = text.split("\n");

  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <View key={`space-${lineIndex}`} style={{ height: 4 }} />;
        }

        // Headings ###, ##, #
        if (trimmed.startsWith("### ")) {
          return (
            <Text
              key={`h3-${lineIndex}`}
              style={[
                { fontWeight: "800", fontSize: 15, marginVertical: 2 },
                style,
              ]}
            >
              {renderInlineFormattedText(
                trimmed.replace(/^###\s+/, ""),
                `h3-${lineIndex}`,
              )}
            </Text>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <Text
              key={`h2-${lineIndex}`}
              style={[
                { fontWeight: "800", fontSize: 16, marginVertical: 3 },
                style,
              ]}
            >
              {renderInlineFormattedText(
                trimmed.replace(/^##\s+/, ""),
                `h2-${lineIndex}`,
              )}
            </Text>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <Text
              key={`h1-${lineIndex}`}
              style={[
                { fontWeight: "900", fontSize: 18, marginVertical: 4 },
                style,
              ]}
            >
              {renderInlineFormattedText(
                trimmed.replace(/^#\s+/, ""),
                `h1-${lineIndex}`,
              )}
            </Text>
          );
        }

        // Bullet list (- , * , • )
        if (
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          trimmed.startsWith("• ")
        ) {
          const content = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <View
              key={`bullet-${lineIndex}`}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingLeft: 4,
              }}
            >
              <Text
                style={[
                  { marginRight: 6, fontSize: 14, fontWeight: "700" },
                  style,
                ]}
              >
                •
              </Text>
              <Text style={[{ flex: 1, lineHeight: 21 }, style]}>
                {renderInlineFormattedText(content, `bullet-${lineIndex}`)}
              </Text>
            </View>
          );
        }

        // Numbered list (1. , 2. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const [, num, content] = numMatch;
          return (
            <View
              key={`num-${lineIndex}`}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingLeft: 4,
              }}
            >
              <Text
                style={[
                  { marginRight: 6, fontWeight: "700", fontSize: 13 },
                  style,
                ]}
              >
                {num}.
              </Text>
              <Text style={[{ flex: 1, lineHeight: 21 }, style]}>
                {renderInlineFormattedText(content, `num-${lineIndex}`)}
              </Text>
            </View>
          );
        }

        // Normal text line
        return (
          <Text key={`line-${lineIndex}`} style={[{ lineHeight: 21 }, style]}>
            {renderInlineFormattedText(line, `line-${lineIndex}`)}
          </Text>
        );
      })}
    </View>
  );
};

export default FormattedMarkdownText;
