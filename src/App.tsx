import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  MapPin,
  Download,
  Map,
  Users,
  StickyNote,
  Lock,
  BarChart3,
  CheckSquare,
} from 'lucide-react';
import CsvUpload from './CsvUpload';
import SalesUpload from './SalesUpload';
import TerritoryMap from './TerritoryMap';
import ExportData from './ExportData';
import TerritoryUpload from './TerritoryUpload';
import CustomerTerritoryUpload from './CustomerTerritoryUpload';
import AllNotes from './AllNotes';
import TerritoryDashboard from './TerritoryDashboard';
import ContactProgress from './ContactProgress';

function App() {
  const [activeTab, setActiveTab] = useState<
    | 'customers'
    | 'sales'
    | 'territory'
    | 'export'
    | 'territory-upload'
    | 'customer-territory'
    | 'notes'
    | 'dashboard'
    | 'contacts'
  >('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'DenverWins1!') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Territory Management
            </h1>
            <p className="text-gray-500 mt-2">
              Please enter the password to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[98%] mx-auto">
          <nav className="flex overflow-x-auto">
            {/* Territory Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Territory Dashboard
            </button>

            {/* Sales Data */}
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Sales Data
            </button>

            {/* Territory Map */}
            <button
              onClick={() => setActiveTab('territory')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'territory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Territory Map
            </button>

            {/* Contact Progress */}
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              Contact Progress
            </button>

            {/* All Notes */}
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <StickyNote className="w-5 h-5" />
              All Notes
            </button>

            {/* Customer Data */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Customer Data
            </button>

            {/* Territory Assignment */}
            <button
              onClick={() => setActiveTab('customer-territory')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'customer-territory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              Territory Assignment
            </button>

            {/* Territory Boundaries */}
            <button
              onClick={() => setActiveTab('territory-upload')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'territory-upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Map className="w-5 h-5" />
              Territory Boundaries
            </button>

            {/* Export Data */}
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="w-5 h-5" />
              Export Data
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[98%] mx-auto py-6">
        <div className="bg-white rounded-lg shadow-md">
          {activeTab === 'dashboard' && <TerritoryDashboard />}
          {activeTab === 'customers' && <CsvUpload />}
          {activeTab === 'sales' && <SalesUpload />}
          {activeTab === 'territory' && <TerritoryMap />}
          {activeTab === 'export' && <ExportData />}
          {activeTab === 'territory-upload' && <TerritoryUpload />}
          {activeTab === 'customer-territory' && <CustomerTerritoryUpload />}
          {activeTab === 'notes' && <AllNotes />}
          {activeTab === 'contacts' && <ContactProgress />}
        </div>
      </div>
    </div>
  );
}

export default App;
