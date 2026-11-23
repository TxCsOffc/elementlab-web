import {HStack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';

/** Цветной квадратик для легенды — цвет задаётся токеном палитры данных */
export function Swatch({color, size = 12}: {color: string; size?: number}) {
  return (
    <svg width={size} height={size} aria-hidden style={{flexShrink: 0}}>
      <rect width={size} height={size} rx={3} style={{fill: color}} />
    </svg>
  );
}

export function Legend({items}: {items: [string, string][]}) {
  return (
    <HStack gap={4} wrap="wrap" vAlign="center">
      {items.map(([label, color]) => (
        <HStack key={label} gap={1.5} vAlign="center">
          <Swatch color={color} />
          <Text type="supporting">{label}</Text>
        </HStack>
      ))}
    </HStack>
  );
}
