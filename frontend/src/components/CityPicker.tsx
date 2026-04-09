import type { City } from '../types';

interface CityPickerProps {
  cities: City[];
  value: string;
  onChange: (slug: string) => void;
}

export function CityPicker({ cities, value, onChange }: CityPickerProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 16px',
        fontSize: 16,
        borderRadius: 6,
        border: '1px solid #ccc',
        cursor: 'pointer',
        minWidth: 200,
      }}
    >
      <option value="">Select a city…</option>
      {cities.map((city) => (
        <option key={city.slug} value={city.slug}>
          {city.display_name}
        </option>
      ))}
    </select>
  );
}
