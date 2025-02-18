import { useState } from "react";
import { Download, CheckSquare, Square, Loader2 } from "lucide-react";
import { supabase } from "./lib/supabase";
import Papa from "papaparse";

interface Field {
  key: string;
  label: string;
  category: "customer" | "address" | "contact" | "sales" | "location";
  path: string[];
}

const AVAILABLE_FIELDS: Field[] = [
  // Customer fields
  {
    key: "customer_name",
    label: "Customer Name",
    category: "customer",
    path: ["customer_name"],
  },
  {
    key: "account_number",
    label: "Account Number",
    category: "customer",
    path: ["account_number"],
  },

  // Address fields
  {
    key: "street",
    label: "Street Address",
    category: "address",
    path: ["addresses", 0, "street"],
  },
  {
    key: "city",
    label: "City",
    category: "address",
    path: ["addresses", 0, "city"],
  },
  {
    key: "state",
    label: "State",
    category: "address",
    path: ["addresses", 0, "state"],
  },
  {
    key: "zip_code",
    label: "ZIP Code",
    category: "address",
    path: ["addresses", 0, "zip_code"],
  },

  // Location fields
  {
    key: "latitude",
    label: "Latitude",
    category: "location",
    path: ["addresses", 0, "geocoded_location", "latitude"],
  },
  {
    key: "longitude",
    label: "Longitude",
    category: "location",
    path: ["addresses", 0, "geocoded_location", "longitude"],
  },

  // Contact fields
  {
    key: "contact_name",
    label: "Contact Name",
    category: "contact",
    path: ["contacts", 0, "contact_name"],
  },
  {
    key: "role",
    label: "Contact Role",
    category: "contact",
    path: ["contacts", 0, "role"],
  },
  {
    key: "phone_number",
    label: "Phone Number",
    category: "contact",
    path: ["contacts", 0, "phone_number"],
  },
  {
    key: "email",
    label: "Email",
    category: "contact",
    path: ["contacts", 0, "email"],
  },

  // Sales fields
  {
    key: "total_sales",
    label: "Total Sales",
    category: "sales",
    path: ["sales"],
  },
];

function ExportData() {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["customer_name", "account_number"])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleField = (key: string) => {
    const newFields = new Set(selectedFields);
    if (newFields.has(key)) {
      newFields.delete(key);
    } else {
      newFields.add(key);
    }
    setSelectedFields(newFields);
  };

  const selectAllFields = () => {
    setSelectedFields(new Set(AVAILABLE_FIELDS.map((field) => field.key)));
  };

  const clearSelection = () => {
    setSelectedFields(new Set());
  };

  const getNestedValue = (obj: any, path: (string | number)[]) => {
    try {
      let current = obj;
      for (const key of path) {
        if (Array.isArray(current) && key === 0 && current.length === 0) {
          return "";
        }
        if (key === "sales") {
          // Calculate total sales
          return current[key]
            .reduce(
              (sum: number, sale: any) => sum + (sale.sales_amount || 0),
              0
            )
            .toFixed(2);
        }
        if (current === undefined || current === null) {
          return "";
        }
        current = current[key];
      }
      // Format decimal numbers to 6 decimal places for coordinates
      if (
        typeof current === "number" &&
        (path.includes("latitude") || path.includes("longitude"))
      ) {
        return current.toFixed(6);
      }
      return current || "";
    } catch (error) {
      return "";
    }
  };

  const exportData = async () => {
    if (selectedFields.size === 0) {
      setError("Please select at least one field to export");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: customers, error } = await supabase.from("customers")
        .select(`
          customer_name,
          account_number,
          addresses (
            street,
            city,
            state,
            zip_code,
            geocoded_location:geocoded_locations (
              latitude,
              longitude
            )
          ),
          contacts (
            contact_name,
            role,
            phone_number,
            email
          ),
          sales (
            sales_amount
          )
        `);

      if (error) throw error;

      const selectedFieldsList = AVAILABLE_FIELDS.filter((field) =>
        selectedFields.has(field.key)
      );

      const csvData = customers.map((customer) => {
        const row: Record<string, string> = {};
        selectedFieldsList.forEach((field) => {
          row[field.label] = getNestedValue(customer, field.path);
        });
        return row;
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `customer_data_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while exporting data"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Download className="w-6 h-6" />
        Export Customer Data
      </h1>

      <div className="space-y-6">
        {/* Field Selection Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={selectAllFields}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Selection
          </button>
        </div>

        {/* Field Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {(
            ["customer", "address", "location", "contact", "sales"] as const
          ).map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-gray-700 capitalize">
                {category} Information
              </h3>
              <div className="space-y-2">
                {AVAILABLE_FIELDS.filter(
                  (field) => field.category === category
                ).map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={() => toggleField(field.key)}
                  >
                    <div className="focus:outline-none">
                      {selectedFields.has(field.key) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={exportData}
          disabled={loading || selectedFields.size === 0}
          className={`
            w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white
            flex items-center justify-center gap-2
            ${
              loading || selectedFields.size === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Selected Fields
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ExportData;
