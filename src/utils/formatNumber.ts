export function formatNumber(value: number | null, decimals = 0) {
    if (value === null) {
        return '—';
    }
    return value.toLocaleString('lv-LV', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
