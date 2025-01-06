export function formatMoney(number: number) {
  if (number == null) return 0;
  // Convert to number type if it isn't already and check if it's valid
  const num = Number(number);
  if (isNaN(num)) return 0;
  return parseFloat(num.toPrecision(12));
}


export function checkAlmostEqual(a: number, b: number) {
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 0.000001;
}


export async function chunkArray(array: any[], chunkSize: number) {
  const numberOfChunks = Math.ceil(array.length / chunkSize);

  return [...Array(numberOfChunks)].map((value, index) => {
    return array.slice(index * chunkSize, (index + 1) * chunkSize);
  });
};
