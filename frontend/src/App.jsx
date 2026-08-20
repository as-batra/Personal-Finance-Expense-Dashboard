import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5001/api/transactions';

// Fixed monthly budget limits for each category in INR (₹)
const BUDGET_LIMITS = {
  Food: 15000,
  Transport: 5000,
  Rent: 35000,
  Entertainment: 10000,
  Utilities: 8000,
  Other: 6000,
};

// Sleek SVG Icon components for professional UI look
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/>
    <line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5v14"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
  </svg>
);

// Minimalist Empty State SVG (replaces the emoji)
const EmptyStateIllustration = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-700 stroke-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch both recent transactions list and category summary aggregation
  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, sumRes] = await Promise.all([
        fetch(API_BASE_URL),
        fetch(`${API_BASE_URL}/summary`)
      ]);

      if (!transRes.ok || !sumRes.ok) {
        throw new Error('Failed to fetch data from the server');
      }

      const transData = await transRes.json();
      const sumData = await sumRes.json();

      setTransactions(transData);
      setSummary(sumData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not connect to the backend server. Make sure the database and API are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create a new transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0) return;

    setSubmitting(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          category,
          date: date || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      setTitle('');
      setAmount('');
      setDate('');
      setCategory('Food');

      await fetchData();
    } catch (err) {
      alert(err.message || 'Error submitting transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an existing transaction
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting transaction');
    }
  };

  // Helper: map summary category spending lookup
  const getCategorySpending = (catName) => {
    const item = summary.find(s => s.category.toLowerCase() === catName.toLowerCase());
    return item ? item.totalSpent : 0;
  };

  // Metric aggregates
  const totalSpent = summary.reduce((sum, item) => sum + item.totalSpent, 0);
  const totalBudget = Object.values(BUDGET_LIMITS).reduce((sum, val) => sum + val, 0);
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-[#0a0f1d] py-5 px-4 md:px-8 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl">
              <WalletIcon />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Expense Dashboard
            </h1>
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
            Overview
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-red-300 text-sm flex flex-col gap-2">
            <span className="font-semibold">Backend Connection Issue</span>
            <span>{error}</span>
            <button onClick={fetchData} className="w-fit text-xs px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 rounded-lg border border-red-500/20 transition-all">
              Retry Connection
            </button>
          </div>
        )}

        {/* Global Financial Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-[#0f1626] border border-slate-900 border-l-4 border-l-purple-500 p-6 rounded-2xl shadow-xl hover:translate-y-[-2px] transition-all duration-300">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Spending</p>
            <p className="text-2xl font-bold text-white mt-1">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-[#0f1626] border border-slate-900 border-l-4 border-l-blue-500 p-6 rounded-2xl shadow-xl hover:translate-y-[-2px] transition-all duration-300">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Monthly Limit</p>
            <p className="text-2xl font-bold text-white mt-1">₹{totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-[#0f1626] border border-slate-900 border-l-4 p-6 rounded-2xl shadow-xl hover:translate-y-[-2px] transition-all duration-300 class-border-left-dynamic"
               style={{ borderLeftColor: remainingBudget < 0 ? '#f43f5e' : '#10b981' }}>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Remaining Balance</p>
            <p className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </section>

        {/* Grid Dashboard Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Form & Budget visualization */}
          <section className="space-y-6 lg:col-span-1">
            
            {/* Form to Record Expense */}
            <div className="bg-[#0f1626] border border-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-900/60 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-purple-500 rounded-full"></span>
                Record Expense
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Groceries"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1b233a] text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[#080d1a] border border-[#1b233a] text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1.5">Date (Optional)</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#080d1a] border border-[#1b233a] text-white rounded-xl px-3 py-3 outline-none focus:border-purple-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1b233a] text-white rounded-xl px-3 py-3 outline-none focus:border-purple-500 transition-all"
                  >
                    {Object.keys(BUDGET_LIMITS).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-purple-900/10 hover:shadow-purple-900/20 transition-all text-xs uppercase tracking-wider mt-2 cursor-pointer"
                >
                  <PlusIcon />
                  {submitting ? 'Adding...' : 'Add Transaction'}
                </button>
              </form>
            </div>

            {/* Dynamic Progress Bars for Budget visualization */}
            <div className="bg-[#0f1626] border border-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-900/60 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-purple-500 rounded-full"></span>
                Budget by Category
              </h2>
              <div className="space-y-4">
                {Object.entries(BUDGET_LIMITS).map(([cat, limit]) => {
                  const spent = getCategorySpending(cat);
                  const percentage = (spent / limit) * 100;
                  const clampedPercentage = Math.min(100, Math.max(0, percentage));

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{cat}</span>
                        <span className="text-slate-400 font-medium">
                          ₹{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} <span className="text-slate-600">/ ₹{limit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </span>
                      </div>
                      
                      {/* 
                        Tailwind Dynamic Width calculation comments:
                        The container acts as the budget track. Inside it, the progress bar's width is dynamically set
                        using an inline CSS style (`style={{ width: `${clampedPercentage}%` }}`) because Tailwind v4 
                        cannot statically compile arbitrary runtime percentage classes. 
                        All other visual decorations (height, background color transitions, rounded caps, etc.) are 
                        managed through Tailwind utilities.
                      */}
                      <div className="h-1.5 w-full bg-[#080d1a] rounded-full overflow-hidden border border-slate-900/80">
                        <div
                          style={{ width: `${clampedPercentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            percentage >= 100 
                              ? 'bg-rose-500' 
                              : percentage >= 80 
                                ? 'bg-amber-500' 
                                : 'bg-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Right Column: Transactions List */}
          <section className="lg:col-span-2 space-y-4 self-stretch">
            <div className="bg-[#0f1626] border border-slate-900 p-6 rounded-2xl shadow-xl h-full flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-900/60 flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-purple-500 rounded-full"></span>
                  Recent Transactions
                </h2>

                {loading && transactions.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
                    Loading transactions...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500">
                    <div className="mb-4 p-3 bg-[#080d1a] rounded-full border border-slate-900">
                      <EmptyStateIllustration />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">No transactions recorded yet.</p>
                    <p className="text-[11px] text-slate-600 mt-1">Use the form to log your first expense.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Description</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Amount</th>
                          <th className="pb-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40 text-slate-200">
                        {transactions.slice(0, 10).map((t) => (
                          <tr key={t._id} className="hover:bg-[#16213c]/20 transition-colors">
                            <td className="py-3.5 pl-2 font-semibold text-white max-w-[160px] truncate">{t.title}</td>
                            <td className="py-3.5">
                              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-[#080d1a] text-slate-300 border border-slate-900">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-400 text-xs">
                              {new Date(t.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                timeZone: 'UTC'
                              })}
                            </td>
                            <td className="py-3.5 text-right font-bold text-white">
                              ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 text-center">
                              <button
                                onClick={() => handleDelete(t._id)}
                                aria-label="Delete transaction"
                                className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {transactions.length > 10 && (
                <div className="text-center pt-4 text-[10px] text-slate-500 border-t border-slate-900/40 mt-4">
                  Showing latest 10 transactions.
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#050810] py-4 text-center text-[10px] text-slate-600 mt-auto">
        <p>Expense Dashboard Portfolio Project</p>
      </footer>
    </div>
  );
}

export default App;
