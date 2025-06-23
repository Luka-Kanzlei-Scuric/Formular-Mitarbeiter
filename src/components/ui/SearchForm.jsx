import React, { useState } from 'react';

function SearchForm() {
  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Ersetzen Sie die URL mit Ihrer tatsächlichen Backend-URL
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/forms/search?name=${encodeURIComponent(searchName)}`);
      
      if (!response.ok) {
        throw new Error(`Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Fehler bei der Suche:', err);
      setError('Fehler bei der Suche. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Formular suchen</h2>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="mb-4">
          <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 mb-1">
            Name des Kunden
          </label>
          <input
            type="text"
            id="searchName"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="z.B. Mariam El-Mustapha"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Suche...' : 'Suchen'}
        </button>
      </form>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {results.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-2">Suchergebnisse:</h3>
          <ul className="divide-y divide-gray-200">
            {results.map((result) => (
              <li key={result.taskId} className="py-3">
                <p className="font-medium">{result.leadName}</p>
                <p className="text-sm text-gray-600">
                  {result.vorname} {result.nachname}
                </p>
                <p className="text-xs text-gray-500">
                  Erstellt: {new Date(result.erstelltAm).toLocaleString('de-DE')}
                </p>
                <a 
                  href={result.formURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  Zum Formular
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : searchName && !loading && (
        <p className="text-gray-600">Keine Ergebnisse gefunden.</p>
      )}
    </div>
  );
}

export default SearchForm;