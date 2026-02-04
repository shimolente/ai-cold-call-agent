import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, Phone, Target, Clock, Users, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

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

interface VisibleMetrics {
  // Volume metrics
  totalCalls: boolean;
  // Intent metrics
  positive: boolean;
  negative: boolean;
  followUp: boolean;
  // Outcome metrics
  qualified: boolean;
  meetingScheduled: boolean;
  noAnswer: boolean;
  notInterested: boolean;
  badTiming: boolean;
  // Performance metrics
  positiveRate: boolean;
  avgDuration: boolean;
  connectionRate: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKPIData] = useState<KPIData>({
    totalCalls: 0,
    positiveRate: 0,
    avgDuration: 0,
    conversionRate: 0,
    trend: { calls: 0, positive: 0, duration: 0, conversion: 0 }
  });

  const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>({
    // Volume metrics
    totalCalls: true,
    // Intent metrics
    positive: true,
    negative: false,
    followUp: false,
    // Outcome metrics
    qualified: false,
    meetingScheduled: false,
    noAnswer: false,
    notInterested: false,
    badTiming: false,
    // Performance metrics
    positiveRate: true,
    avgDuration: false,
    connectionRate: false
  });

  const [showMetricsMenu, setShowMetricsMenu] = useState(false);

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

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .gte('call_date', timeConfig.startDate)
        .lte('call_date', timeConfig.endDate + 'T23:59:59')
        .order('call_date', { ascending: true });

      if (error) throw error;

      setCallLogs(data || []);
      calculateKPIs(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const calculateKPIs = (logs: CallLog[]) => {
    const totalCalls = logs.length;
    const positiveCalls = logs.filter(l => l.intent_label === 'positive').length;
    const positiveRate = totalCalls > 0 ? (positiveCalls / totalCalls) * 100 : 0;
    const avgDuration = totalCalls > 0 ? logs.reduce((sum, l) => sum + l.duration, 0) / totalCalls : 0;
    const conversionRate = positiveCalls > 0 ? (positiveCalls * 0.35) : 0;

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
      case 'yesterday': {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      }
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'this_week': {
        const dayOfWeek = now.getDay();
        const monday = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
        startDate = monday.toISOString().split('T')[0];
        break;
      }
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

  const toggleMetric = (metric: keyof VisibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Prepare chart data based on granularity
  const getChartData = () => {
    if (callLogs.length === 0) return [];

    const dataMap = new Map<string, { 
      date: string; 
      calls: number; 
      positive: number; 
      negative: number; 
      followUp: number;
      qualified: number;
      meetingScheduled: number;
      noAnswer: number;
      notInterested: number;
      badTiming: number;
      connected: number;
      positiveRate: number;
      avgDuration: number;
      connectionRate: number;
      totalDuration: number;
      callCount: number;
    }>();

    callLogs.forEach(log => {
      const date = new Date(log.call_date);
      let key = '';

      switch (timeConfig.granularity) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        }
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { 
          date: key, 
          calls: 0, 
          positive: 0, 
          negative: 0, 
          followUp: 0,
          qualified: 0,
          meetingScheduled: 0,
          noAnswer: 0,
          notInterested: 0,
          badTiming: 0,
          connected: 0,
          positiveRate: 0,
          avgDuration: 0,
          connectionRate: 0,
          totalDuration: 0,
          callCount: 0
        });
      }

      const entry = dataMap.get(key)!;
      entry.calls++;
      entry.totalDuration += log.duration;
      entry.callCount++;
      
      // Track intent
      if (log.intent_label === 'positive') entry.positive++;
      else if (log.intent_label === 'no-interest') entry.negative++;
      else if (log.intent_label === 'follow-up') entry.followUp++;
      
      // Track outcomes (would need outcome_status from campaign_contacts)
      // For now, approximate from intent_label
      if (log.intent_label === 'positive') {
        entry.qualified++;
        entry.connected++;
      } else if (log.intent_label === 'no-interest') {
        entry.notInterested++;
        entry.connected++;
      } else if (log.intent_label === 'follow-up') {
        entry.badTiming++;
        entry.connected++;
      }
    });

    // Calculate rates and averages
    return Array.from(dataMap.values()).map(entry => ({
      ...entry,
      positiveRate: entry.calls > 0 ? (entry.positive / entry.calls) * 100 : 0,
      connectionRate: entry.calls > 0 ? (entry.connected / entry.calls) * 100 : 0,
      avgDuration: entry.callCount > 0 ? entry.totalDuration / entry.callCount / 60 : 0 // in minutes
    })).sort((a, b) => a.date.localeCompare(b.date));
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

  const metricsConfig = [
    // Volume Metrics
    { key: 'totalCalls' as keyof VisibleMetrics, label: 'Total Calls', color: '#3b82f6', type: 'bar', group: 'Volume' },
    
    // Intent Metrics
    { key: 'positive' as keyof VisibleMetrics, label: 'Positive Intent', color: '#10b981', type: 'bar', group: 'Intent' },
    { key: 'negative' as keyof VisibleMetrics, label: 'No Interest', color: '#ef4444', type: 'bar', group: 'Intent' },
    { key: 'followUp' as keyof VisibleMetrics, label: 'Follow-Up', color: '#f59e0b', type: 'bar', group: 'Intent' },
    
    // Outcome Metrics
    { key: 'qualified' as keyof VisibleMetrics, label: 'Qualified', color: '#059669', type: 'bar', group: 'Outcomes' },
    { key: 'meetingScheduled' as keyof VisibleMetrics, label: 'Meeting Scheduled', color: '#7c3aed', type: 'bar', group: 'Outcomes' },
    { key: 'noAnswer' as keyof VisibleMetrics, label: 'No Answer', color: '#94a3b8', type: 'bar', group: 'Outcomes' },
    { key: 'notInterested' as keyof VisibleMetrics, label: 'Not Interested', color: '#dc2626', type: 'bar', group: 'Outcomes' },
    { key: 'badTiming' as keyof VisibleMetrics, label: 'Bad Timing', color: '#fb923c', type: 'bar', group: 'Outcomes' },
    
    // Performance Metrics
    { key: 'positiveRate' as keyof VisibleMetrics, label: 'Positive Rate %', color: '#059669', type: 'line', group: 'Performance' },
    { key: 'connectionRate' as keyof VisibleMetrics, label: 'Connection Rate %', color: '#0284c7', type: 'line', group: 'Performance' },
    { key: 'avgDuration' as keyof VisibleMetrics, label: 'Avg Duration (min)', color: '#8b5cf6', type: 'line', group: 'Performance' }
  ];

  const activeMetricsCount = Object.values(visibleMetrics).filter(Boolean).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Track your campaign performance and insights</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Performance Over Time</h2>
              
              {/* Metrics Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowMetricsMenu(!showMetricsMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Metrics ({activeMetricsCount})</span>
                </button>

                {showMetricsMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMetricsMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase">Select Metrics to Display</p>
                      </div>
                      
                      {/* Group metrics by category */}
                      {['Volume', 'Intent', 'Outcomes', 'Performance'].map(group => {
                        const groupMetrics = metricsConfig.filter(m => m.group === group);
                        return (
                          <div key={group}>
                            <div className="px-4 py-2 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-700">{group}</p>
                            </div>
                            {groupMetrics.map(metric => (
                              <label
                                key={metric.key}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleMetrics[metric.key]}
                                  onChange={() => toggleMetric(metric.key)}
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: metric.color }}
                                  />
                                  <span className="text-sm text-gray-700">{metric.label}</span>
                                </div>
                                {visibleMetrics[metric.key] ? (
                                  <Eye className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                              </label>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {activeMetricsCount === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Select at least one metric to display</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  
                  {visibleMetrics.totalCalls && (
                    <Bar yAxisId="left" dataKey="calls" fill="#3b82f6" name="Total Calls" />
                  )}
                  {visibleMetrics.positive && (
                    <Bar yAxisId="left" dataKey="positive" fill="#10b981" name="Positive Intent" />
                  )}
                  {visibleMetrics.negative && (
                    <Bar yAxisId="left" dataKey="negative" fill="#ef4444" name="No Interest" />
                  )}
                  {visibleMetrics.followUp && (
                    <Bar yAxisId="left" dataKey="followUp" fill="#f59e0b" name="Follow-Up" />
                  )}
                  {visibleMetrics.qualified && (
                    <Bar yAxisId="left" dataKey="qualified" fill="#059669" name="Qualified" />
                  )}
                  {visibleMetrics.meetingScheduled && (
                    <Bar yAxisId="left" dataKey="meetingScheduled" fill="#7c3aed" name="Meeting Scheduled" />
                  )}
                  {visibleMetrics.noAnswer && (
                    <Bar yAxisId="left" dataKey="noAnswer" fill="#94a3b8" name="No Answer" />
                  )}
                  {visibleMetrics.notInterested && (
                    <Bar yAxisId="left" dataKey="notInterested" fill="#dc2626" name="Not Interested" />
                  )}
                  {visibleMetrics.badTiming && (
                    <Bar yAxisId="left" dataKey="badTiming" fill="#fb923c" name="Bad Timing" />
                  )}
                  {visibleMetrics.positiveRate && (
                    <Line yAxisId="right" type="monotone" dataKey="positiveRate" stroke="#059669" strokeWidth={2} name="Positive Rate %" dot={{ r: 4 }} />
                  )}
                  {visibleMetrics.connectionRate && (
                    <Line yAxisId="right" type="monotone" dataKey="connectionRate" stroke="#0284c7" strokeWidth={2} name="Connection Rate %" dot={{ r: 4 }} />
                  )}
                  {visibleMetrics.avgDuration && (
                    <Line yAxisId="right" type="monotone" dataKey="avgDuration" stroke="#8b5cf6" strokeWidth={2} name="Avg Duration (min)" dot={{ r: 4 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Intent Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intent Distribution</h2>
              {intentData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={intentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
              )}
            </div>

            {/* Pain Points Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Pain Points</h2>
              {painPointsData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No pain points data</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={painPointsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              )}
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