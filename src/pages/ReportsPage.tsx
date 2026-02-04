import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, Phone, Target, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

type Granularity = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type PeriodPreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'all_time' | 'custom';

interface TimeConfig {
  granularity: Granularity;
  preset: PeriodPreset;
  startDate: string;
  endDate: string;
  compareEnabled: boolean;
  compareStartDate: string | null;
  compareEndDate: string | null;
}

interface CallLog {
  id: string;
  call_date: string;
  duration: number;
  intent_label: string;
  campaign_id: string;
  pain_points_discussed: string[] | null;
  usps_used: string[] | null;
}

interface KPIData {
  totalCalls: number;
  positiveRate: number;
  avgDuration: number;
  conversionRate: number;
  trend: {
    calls: number;
    positive: number;
    duration: number;
    conversion: number;
  };
}

const ReportsPage = () => {
  const [timeConfig, setTimeConfig] = useState<TimeConfig>({
    granularity: 'daily',
    preset: 'last_30_days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    compareEnabled: false,
    compareStartDate: null,
    compareEndDate: null
  });

  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKPIData] = useState<KPIData>({
    totalCalls: 0,
    positiveRate: 0,
    avgDuration: 0,
    conversionRate: 0,
    trend: { calls: 0, positive: 0, duration: 0, conversion: 0 }
  });

  const periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'Last 90 Days', value: 'last_90_days' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'Last Quarter', value: 'last_quarter' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'All Time', value: 'all_time' },
    { label: 'Custom Range...', value: 'custom' }
  ];

  useEffect(() => {
    fetchData();
  }, [timeConfig.startDate, timeConfig.endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .gte('call_date', timeConfig.startDate)
        .lte('call_date', timeConfig.endDate)
        .order('call_date', { ascending: true });

      if (error) throw error;

      setCallLogs(data || []);
      calculateKPIs(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (logs: CallLog[]) => {
    const totalCalls = logs.length;
    const positiveCalls = logs.filter(l => l.intent_label === 'positive').length;
    const positiveRate = totalCalls > 0 ? (positiveCalls / totalCalls) * 100 : 0;
    const avgDuration = totalCalls > 0 ? logs.reduce((sum, l) => sum + l.duration, 0) / totalCalls : 0;
    const conversionRate = positiveCalls > 0 ? (positiveCalls * 0.35) : 0; // Mock conversion

    // Calculate trends (mock for now - would compare to previous period)
    setKPIData({
      totalCalls,
      positiveRate,
      avgDuration,
      conversionRate,
      trend: {
        calls: 12,
        positive: 8,
        duration: -5,
        conversion: 15
      }
    });
  };

  const handlePeriodChange = (preset: PeriodPreset) => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        startDate = endDate;
        break;
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        const monday = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
        startDate = monday.toISOString().split('T')[0];
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'all_time':
        startDate = '2020-01-01';
        break;
      case 'custom':
        setShowCustomDatePicker(true);
        return;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    setTimeConfig({ ...timeConfig, preset, startDate, endDate });
    setShowCustomDatePicker(false);
  };

  // Prepare chart data based on granularity
  const getChartData = () => {
    if (callLogs.length === 0) return [];

    const dataMap = new Map<string, { date: string; calls: number; positive: number; negative: number; followUp: number }>();

    callLogs.forEach(log => {
      const date = new Date(log.call_date);
      let key = '';

      switch (timeConfig.granularity) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { date: key, calls: 0, positive: 0, negative: 0, followUp: 0 });
      }

      const entry = dataMap.get(key)!;
      entry.calls++;
      if (log.intent_label === 'positive') entry.positive++;
      else if (log.intent_label === 'no-interest') entry.negative++;
      else if (log.intent_label === 'follow-up') entry.followUp++;
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Intent distribution data
  const getIntentData = () => {
    const positive = callLogs.filter(l => l.intent_label === 'positive').length;
    const negative = callLogs.filter(l => l.intent_label === 'no-interest').length;
    const followUp = callLogs.filter(l => l.intent_label === 'follow-up').length;
    const other = callLogs.length - positive - negative - followUp;

    return [
      { name: 'Positive', value: positive, color: '#10b981' },
      { name: 'Follow-Up', value: followUp, color: '#f59e0b' },
      { name: 'No Interest', value: negative, color: '#ef4444' },
      { name: 'Other', value: other, color: '#6b7280' }
    ].filter(item => item.value > 0);
  };

  // Pain points analysis
  const getPainPointsData = () => {
    const painPointsMap = new Map<string, number>();

    callLogs.forEach(log => {
      if (log.pain_points_discussed) {
        log.pain_points_discussed.forEach(point => {
          painPointsMap.set(point, (painPointsMap.get(point) || 0) + 1);
        });
      }
    });

    return Array.from(painPointsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const chartData = getChartData();
  const intentData = getIntentData();
  const painPointsData = getPainPointsData();

  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Track your campaign performance and insights</p>
      </div>

      {/* Time Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          {/* Granularity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View by:</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'quarterly'] as Granularity[]).map(gran => (
                <button
                  key={gran}
                  onClick={() => setTimeConfig({ ...timeConfig, granularity: gran })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    timeConfig.granularity === gran
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {gran.charAt(0).toUpperCase() + gran.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Period Selection */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period:</label>
              <select
                value={timeConfig.preset}
                onChange={(e) => handlePeriodChange(e.target.value as PeriodPreset)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 pt-7">
              <Calendar className="w-4 h-4" />
              <span>{new Date(timeConfig.startDate).toLocaleDateString()} - {new Date(timeConfig.endDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date:</label>
                <input
                  type="date"
                  value={timeConfig.startDate}
                  onChange={(e) => setTimeConfig({ ...timeConfig, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date:</label>
                <input
                  type="date"
                  value={timeConfig.endDate}
                  onChange={(e) => setTimeConfig({ ...timeConfig, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Comparison Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={timeConfig.compareEnabled}
                onChange={(e) => setTimeConfig({ ...timeConfig, compareEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Compare to previous period</span>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Phone className="w-8 h-8 text-blue-500" />
                {formatTrend(kpiData.trend.calls)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpiData.totalCalls}</p>
              <p className="text-sm text-gray-600">Total Calls</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-green-500" />
                {formatTrend(kpiData.trend.positive)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpiData.positiveRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Positive Rate</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-purple-500" />
                {formatTrend(kpiData.trend.duration)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{Math.floor(kpiData.avgDuration / 60)}:{String(Math.floor(kpiData.avgDuration % 60)).padStart(2, '0')}</p>
              <p className="text-sm text-gray-600">Avg Duration</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-orange-500" />
                {formatTrend(kpiData.trend.conversion)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpiData.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
          </div>

          {/* Performance Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Total Calls" />
                <Area type="monotone" dataKey="positive" stackId="2" stroke="#10b981" fill="#10b981" name="Positive" />
                <Area type="monotone" dataKey="followUp" stackId="2" stroke="#f59e0b" fill="#f59e0b" name="Follow-Up" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Intent Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intent Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pain Points Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Pain Points</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={painPointsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;