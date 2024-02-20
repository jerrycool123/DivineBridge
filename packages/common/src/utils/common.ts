export namespace CommonUtils {
  export const hex2int = (hex: string): number => parseInt(hex.replace(/^#/, ''), 16);

  export const getRandomColor = (): number => Math.floor(Math.random() * 16777215);
}
