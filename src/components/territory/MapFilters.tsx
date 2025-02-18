import React from 'react';
import { Filter, Tag, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { CLASSIFICATIONS, CLASSIFICATION_COLORS } from '../../constants/map';

interface MapFiltersProps {
  territories: string[];
  selectedTerritory: string;
  selectedClassifications: Set<string>;
  markerCount: number;
  onTerritoryChange: (territory: string) => void;
  onClassificationToggle: (classification: string) => void;
  initialLoad: boolean;
}

function MapFilters({
  territories,
  selectedTerritory,
  selectedClassifications,
  markerCount,
  onTerritoryChange,
  onClassificationToggle,
  initialLoad
}: MapFiltersProps) {
  return (
    <>
      {initialLoad && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Initially showing only 'A' classified accounts to improve loading time.
              Select additional classifications to load more accounts.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Tag className="w-4 h-4" />
            Classifications ({markerCount} accounts):
          </span>
          <div className="flex gap-3">
            {CLASSIFICATIONS.map((classification) => (
              <button
                key={classification}
                onClick={() => onClassificationToggle(classification)}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                {selectedClassifications.has(classification) ? (
                  <CheckSquare className="w-4 h-4" style={{ color: CLASSIFICATION_COLORS[classification] }} />
                ) : (
                  <Square className="w-4 h-4" style={{ color: CLASSIFICATION_COLORS[classification] }} />
                )}
                {classification}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedTerritory}
            onChange={(e) => onTerritoryChange(e.target.value)}
            className="block w-full lg:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">All Territories</option>
            {territories.map((territory) => (
              <option key={territory} value={territory}>
                {territory}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4">
        <span className="text-sm font-medium text-gray-700">Map Marker Colors:</span>
        {CLASSIFICATIONS.map((classification) => (
          <div key={classification} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: CLASSIFICATION_COLORS[classification] }}
            />
            <span className="text-sm text-gray-600">{classification}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: CLASSIFICATION_COLORS.default }}
          />
          <span className="text-sm text-gray-600">Not Classified</span>
        </div>
      </div>
    </>
  );
}

export default MapFilters;