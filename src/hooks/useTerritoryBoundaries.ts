import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TerritoryBoundary } from '../types/territory';

interface Point {
  lat: number;
  lng: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useTerritoryBoundaries() {
  const [boundaries, setBoundaries] = useState<TerritoryBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePoint = (point: Point): ValidationResult => {
    const errors: string[] = [];

    if (typeof point.lat !== 'number' || isNaN(point.lat) || !isFinite(point.lat)) {
      errors.push('Invalid latitude value');
    }

    if (typeof point.lng !== 'number' || isNaN(point.lng) || !isFinite(point.lng)) {
      errors.push('Invalid longitude value');
    }

    if (point.lat < 24.396308 || point.lat > 49.384358) {
      errors.push('Latitude outside US bounds');
    }

    if (point.lng < -125.000000 || point.lng > -66.934570) {
      errors.push('Longitude outside US bounds');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validatePolygon = (points: Point[]): ValidationResult => {
    const errors: string[] = [];

    if (!Array.isArray(points)) {
      return { isValid: false, errors: ['Invalid points array'] };
    }

    if (points.length < 3) {
      return { isValid: false, errors: ['Polygon must have at least 3 points'] };
    }

    // Validate each point
    points.forEach((point, index) => {
      const pointValidation = validatePoint(point);
      if (!pointValidation.isValid) {
        errors.push(`Point ${index + 1}: ${pointValidation.errors.join(', ')}`);
      }
    });

    // Check if polygon is closed (first and last points match)
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng) {
      errors.push('Polygon is not closed (first and last points must match)');
    }

    // Check for self-intersection
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 2; j < points.length - 1; j++) {
        if (doLineSegmentsIntersect(
          points[i], points[i + 1],
          points[j], points[j + 1]
        )) {
          errors.push('Polygon has self-intersecting edges');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const doLineSegmentsIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
    const ccw = (A: Point, B: Point, C: Point) => {
      return (C.lng - A.lng) * (B.lat - A.lat) > (B.lng - A.lng) * (C.lat - A.lat);
    };
    
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  };

  const fetchBoundaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('territory_boundaries')
        .select('*')
        .order('territory_name, sequence');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setBoundaries([]);
        return [];
      }

      // Group and validate points by territory
      const boundariesMap = new Map<string, Point[]>();
      const validationErrors = new Map<string, string[]>();

      data.forEach(boundary => {
        const point: Point = {
          lat: Number(boundary.latitude),
          lng: Number(boundary.longitude)
        };

        const validation = validatePoint(point);
        if (!validation.isValid) {
          const errors = validationErrors.get(boundary.territory_name) || [];
          errors.push(...validation.errors);
          validationErrors.set(boundary.territory_name, errors);
          return;
        }

        const points = boundariesMap.get(boundary.territory_name) || [];
        points.push(point);
        boundariesMap.set(boundary.territory_name, points);
      });

      // Validate each territory's polygon
      const validBoundaries: TerritoryBoundary[] = [];

      for (const [territory_name, points] of boundariesMap.entries()) {
        const validation = validatePolygon(points);
        
        if (!validation.isValid) {
          console.warn(`Invalid territory boundary for ${territory_name}:`, validation.errors);
          validationErrors.set(territory_name, validation.errors);
          continue;
        }

        validBoundaries.push({ territory_name, points });
      }

      // Log validation errors if any
      if (validationErrors.size > 0) {
        console.warn('Territory boundary validation errors:', 
          Object.fromEntries(validationErrors.entries())
        );
      }

      setBoundaries(validBoundaries);
      return validBoundaries;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch territory boundaries: ${message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    boundaries,
    loading,
    error,
    fetchBoundaries,
    validatePoint,
    validatePolygon
  };
}