import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ThemeData } from '../services/analyticsService';

interface DashboardChartsProps {
    themeData: ThemeData[];
    timelineData: { date: string; pages: number }[];
    characterData?: { name: string; mentions: number }[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ themeData, timelineData, characterData }) => {
    // Prepare radar chart data
    const radarData = themeData.map(theme => ({
        theme: theme.name,
        value: theme.percentage,
        fullMark: 100
    }));

    // Prepare timeline data (last 8 weeks)
    const recentTimeline = timelineData.slice(-8).map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    }));

    return (
        <div className="space-y-8">
            {/* Thematic Balance Radar Chart */}
            {themeData.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-ink-100">
                    <h3 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Équilibre Thématique (Vue Radar)
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e7e5e4" />
                            <PolarAngleAxis
                                dataKey="theme"
                                tick={{ fill: '#78716c', fontSize: 12, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: '#a8a29e', fontSize: 10 }}
                            />
                            <Radar
                                name="Pourcentage"
                                dataKey="value"
                                stroke="#b45309"
                                fill="#b45309"
                                fillOpacity={0.6}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e7e5e4',
                                    borderRadius: '12px',
                                    padding: '8px 12px'
                                }}
                                formatter={(value: any) => [`${value}%`, 'Couverture']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Writing Progress Timeline */}
            {timelineData.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-ink-100">
                    <h3 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Progression de l'Écriture
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={recentTimeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#78716c', fontSize: 11 }}
                                stroke="#d6d3d1"
                            />
                            <YAxis
                                tick={{ fill: '#78716c', fontSize: 11 }}
                                stroke="#d6d3d1"
                                label={{ value: 'Pages', angle: -90, position: 'insideLeft', fill: '#78716c' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e7e5e4',
                                    borderRadius: '12px',
                                    padding: '8px 12px'
                                }}
                                formatter={(value: any) => [`${value} pages`, 'Écrites']}
                            />
                            <Line
                                type="monotone"
                                dataKey="pages"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Character Mentions Bar Chart */}
            {characterData && characterData.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-ink-100">
                    <h3 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Personnages Principaux
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={characterData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#78716c', fontSize: 11 }}
                                stroke="#d6d3d1"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tick={{ fill: '#78716c', fontSize: 11 }}
                                stroke="#d6d3d1"
                                label={{ value: 'Mentions', angle: -90, position: 'insideLeft', fill: '#78716c' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e7e5e4',
                                    borderRadius: '12px',
                                    padding: '8px 12px'
                                }}
                                formatter={(value: any) => [`${value} fois`, 'Mentionné']}
                            />
                            <Bar
                                dataKey="mentions"
                                fill="#3b82f6"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default DashboardCharts;
