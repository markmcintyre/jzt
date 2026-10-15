export class Color {
  constructor(code, name, index, r, g, b) {
    const byteToHex = (number) => {
      let value = number.toString(16);
      if (value.length <= 1) value = '0' + value;
      return value;
    };
    this.code = code;
    this.name = name;
    if (index !== undefined) this.index = index;
    if (r !== undefined && g !== undefined && b !== undefined) {
      this.r = r; this.g = g; this.b = b;
      this.rgbValue = '#' + byteToHex(r) + byteToHex(g) + byteToHex(b);
    }
  }
  darken() { return colors[this.index - 8] || this; }
  lighten() { return colors[this.index + 8] || this; }
  isLight() { return this.index >= 8; }
  isDark() { return this.index < 8; }
}
export class CyclingColor extends Color {
  constructor(code, name, cycleSequence) {
    super(code, name); this.cycles = true; this.cycleSequence = cycleSequence;
    this.code = code; this.name = name; this.cycleIndex = 0; this.update();
  }
  update() {
    this.cycleIndex = this.cycleIndex + 1 < this.cycleSequence.length ? this.cycleIndex + 1 : 0;
    const sequenceColor = this.cycleSequence[this.cycleIndex];
    this.index = sequenceColor.index; this.r = sequenceColor.r; this.g = sequenceColor.g;
    this.b = sequenceColor.b; this.rgbValue = sequenceColor.rgbValue;
  }
}
export const colors = [
  new Color('0', 'Black', 0, 0, 0, 0), new Color('1', 'Blue', 1, 0, 0, 170),
  new Color('2', 'Green', 2, 0, 170, 0), new Color('3', 'Cyan', 3, 0, 170, 170),
  new Color('4', 'Red', 4, 170, 0, 0), new Color('5', 'Magenta', 5, 170, 0, 170),
  new Color('6', 'Brown', 6, 170, 85, 0), new Color('7', 'White', 7, 170, 170, 170),
  new Color('8', 'Grey', 8, 85, 85, 85), new Color('9', 'BrightBlue', 9, 85, 85, 255),
  new Color('A', 'BrightGreen', 10, 85, 255, 85), new Color('B', 'BrightCyan', 11, 85, 255, 255),
  new Color('C', 'BrightRed', 12, 255, 85, 85), new Color('D', 'BrightMagenta', 13, 255, 85, 255),
  new Color('E', 'Yellow', 14, 255, 255, 85), new Color('F', 'BrightWhite', 15, 255, 255, 255),
];
export const cycle = new CyclingColor('*', 'Cycle', colors.slice(9));
export const Colors = {};
for (const color of colors) { Colors[color.name] = color; Colors[color.name.toUpperCase()] = color; }
Colors.Cycle = cycle;
export const ColorUtilities = {
  getColor: (hexDigit) => colors[parseInt(hexDigit, 16)],
  deserializeForeground(colorCode) {
    const code = colorCode.length === 2 ? colorCode.charAt(1) : colorCode.length === 1 ? colorCode.charAt(0) : undefined;
    if (code) return code === '*' ? cycle : this.getColor(code);
    throw 'Invalid color code: ' + colorCode;
  },
  deserializeBackground(colorCode) {
    if (colorCode.length === 2) { const code = colorCode.charAt(0); return code === '*' ? undefined : this.getColor(code); }
    return undefined;
  },
  serialize(background, foreground) {
    return (background === undefined ? '*' : background.code) + (foreground === undefined ? 'E' : foreground instanceof CyclingColor ? '*' : foreground.code);
  },
};
