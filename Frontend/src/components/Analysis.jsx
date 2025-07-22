import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- Chart Colors ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const Analysis = () => {
    const navigate = useNavigate();
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- NEW: State for month/year selection ---
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1, // Default to current month
        year: new Date().getFullYear(),   // Default to current year
    });

    useEffect(() => {
        const email = localStorage.getItem("email");
        if (!email) {
            navigate("/login");
            return;
        }

        const fetchAnalysis = async () => {
            try {
                setLoading(true);
                setError(''); // Clear previous errors
                const response = await fetch('http://127.0.0.1:8000/app/api/get-analysis/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: email,
                        month: selectedDate.month,
                        year: selectedDate.year,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch analysis data.');
                }

                const data = await response.json();
                setAnalysisData(data);
            } catch (err) {
                setError(err.message);
                setAnalysisData(null); // Clear old data on error
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    // Re-run the effect whenever the selectedDate changes
    }, [navigate, selectedDate]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setSelectedDate(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    // --- Generate options for year dropdown ---
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const monthOptions = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    const renderDashboard = () => {
        if (!analysisData || analysisData.message) {
            return (
                <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">No Data Available</h2>
                    <p className="text-gray-600">{analysisData?.message || "No analysis data found for the selected period."}</p>
                </div>
            )
        }
        
        const pieData = [
            { name: 'Credited', value: analysisData.pie_chart_data.credited },
            { name: 'Debited', value: analysisData.pie_chart_data.debited },
        ];

        return (
            <>
                {/* AI Insights Section */}
                <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">AI Financial Advisor</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{analysisData.ai_insights}</p>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-semibold mb-4">Income vs. Expense</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    <Cell key={`cell-0`} fill={COLORS[1]} />
                                    <Cell key={`cell-1`} fill={COLORS[3]} />
                                </Pie>
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-semibold mb-4">Spending by Category</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analysisData.bar_chart_data} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `₹${value/1000}k`} />
                                <YAxis type="category" dataKey="category" width={100} interval={0} />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Bar dataKey="total" fill={COLORS[0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="font-semibold mb-4">Transaction History for Selected Period</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Description</th>
                                    <th scope="col" className="px-6 py-3">Category</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysisData.transactions.map((tx) => (
                                    <tr key={tx.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{tx.description.substring(0, 70)}...</td>
                                        <td className="px-6 py-4">{tx.category || 'N/A'}</td>
                                        <td className={`px-6 py-4 text-right font-medium ${tx.transaction_type === 'credited' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.transaction_type === 'credited' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    };
    
    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Financial Analysis</h1>
                    {/* Date Selection Dropdowns */}
                    <div className="flex items-center gap-4">
                        <select name="month" value={selectedDate.month} onChange={handleDateChange} className="p-2 border rounded-lg shadow-sm">
                            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select name="year" value={selectedDate.year} onChange={handleDateChange} className="p-2 border rounded-lg shadow-sm">
                            {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-10">Loading financial analysis...</div>
                ) : error ? (
                    <div className="text-center p-10 text-red-500 bg-white rounded-2xl shadow-lg">Error: {error}</div>
                ) : (
                    renderDashboard()
                )}
            </div>
        </div>
    );
};

export default Analysis;
