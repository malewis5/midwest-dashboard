export const CLASSIFICATIONS = ['A', 'B+', 'B', 'C'] as const;

export const MARKER_PATH = "M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z";

export const CLASSIFICATION_COLORS = {
  'A': '#22C55E',  // Green
  'B+': '#3B82F6', // Blue
  'B': '#6366F1',  // Indigo
  'C': '#EAB308',  // Yellow
  'default': '#9CA3AF' // Gray
} as const;

// Predefined colors for territories with better visibility
export const TERRITORY_COLORS = {
  'Denver Metro': '#FF6B6B',      // Coral Red
  'Northern Colorado': '#4ECDC4',  // Turquoise
  'Southern Colorado': '#45B7D1',  // Sky Blue
  'Western Colorado': '#96CEB4',   // Sage Green
  'Eastern Colorado': '#FFEEAD',   // Cream Yellow
  'default': '#D4A5A5'            // Dusty Rose
} as const;

// Territory polygon styling with increased opacity
export const TERRITORY_POLYGON_OPTIONS = {
  strokeWeight: 2,
  fillOpacity: 0.35, // Increased from 0.2 for better visibility
  strokeOpacity: 1.0, // Increased from 0.8 for better visibility
  clickable: false,
  geodesic: true,
  zIndex: 1
} as const;