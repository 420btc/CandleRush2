import React from "react";

interface FlipDigitsProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FlipDigits: React.FC<FlipDigitsProps> = ({ value, className = '', style = {} }) => {
  const [lastValue, setLastValue] = React.useState<string>(value);
  const [flipFlags, setFlipFlags] = React.useState<boolean[]>([]);
  const flipRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

  React.useEffect(() => {
    if (value !== lastValue) {
      const lastArr = lastValue.split("");
      const valueArr = value.split("");
      const newFlags = valueArr.map((c, idx) => c !== (lastArr[idx] ?? ' '));
      setFlipFlags(newFlags);
      setLastValue(value);
    } else if (flipFlags.length !== value.length) {
      setFlipFlags(value.split('').map(() => false));
    }
    // eslint-disable-next-line
  }, [value]);

  React.useEffect(() => {
    flipFlags.forEach((flag, idx) => {
      const el = flipRefs.current[idx];
      if (el && flag) {
        el.classList.remove('flip');
        void el.offsetWidth;
        el.classList.add('flip');
      }
    });
  }, [flipFlags, value]);

  return (
    <span className={className} style={style}>
      {value.split('').map((char, idx) => (
        <span
          key={idx + '-' + char}
          ref={el => { flipRefs.current[idx] = el; }}
          style={{ display: 'inline-block', transition: 'color 0.3s' }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default FlipDigits;
