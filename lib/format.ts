// Always shows 2 decimal places (e.g. "3,999.00"), matching how prices are
// quoted throughout the site — plain toLocaleString('en-IN') drops trailing
// zeros/decimals inconsistently depending on the value.
export function formatINR(value: number | string): string {
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
