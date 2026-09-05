import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  delay?: number;
  distance?: number;
  duration?: number;
}

export default function FloatingChip({
  children,
  style,
  delay = 0,
  distance = 10,
  duration = 2200,
}: Props) {
  const offset = useSharedValue(0);

  useEffect(() => {
    const start = () => {
      offset.value = withRepeat(
        withSequence(
          withTiming(-distance, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      );
    };

    if (delay === 0) {
      start();
      return;
    }

    const timer = setTimeout(start, delay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: offset.value,
      },
      {
        scale: 1 + Math.abs(offset.value) / 180,
      },
      {
        rotate: `${offset.value / 20}deg`,
      },
    ] as any,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
